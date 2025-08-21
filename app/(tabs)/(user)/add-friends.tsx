import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

interface User {
  id: string;
  display_name: string;
  created_at: string;
}

interface SearchResult {
  user: User;
  isFriend: boolean;
  requestSent: boolean;
  requestReceived: boolean;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  requester: {
    display_name: string;
    created_at: string;
  };
  created_at: string;
}

export default function AddFriendsScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchFriendRequests = async () => {
    if (!session?.user) return;

    setLoadingRequests(true);
    try {
      // First, get the pending friend requests
      const { data: requests, error } = await supabase
        .from("friendships")
        .select("id, requester_id, created_at")
        .eq("addressee_id", session.user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Error fetching friend requests:", error);
        return;
      }

      // Transform the data and fetch user profiles separately
      const transformedRequests = await Promise.all(
        (requests || []).map(async (req: any) => {
          // Fetch the requester's profile
          const { data: requesterProfile, error: profileError } = await supabase
            .from("user_profiles")
            .select("display_name, created_at")
            .eq("user_id", req.requester_id)
            .single();

          if (profileError) {
            console.log("⚠️ Error fetching requester profile:", profileError);
          }

          return {
            id: req.id,
            requester_id: req.requester_id,
            created_at: req.created_at,
            requester: {
              display_name: requesterProfile?.display_name || "Unknown User",
              created_at: requesterProfile?.created_at || req.created_at,
            },
          };
        })
      );

      setFriendRequests(transformedRequests);
    } catch (error) {
      console.log("Error in fetchFriendRequests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!session?.user || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Search for users by display_name in user_profiles (excluding current user)
      const { data: users, error } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, created_at")
        .ilike("display_name", `%${query}%`)
        .neq("user_id", session.user.id)
        .limit(20);

      if (error) {
        console.log("Error searching users:", error);
        setSearchResults([]);
        return;
      }

      // For each user, check friendship status using the friendships table
      const resultsWithStatus = await Promise.all(
        (users || []).map(async (user) => {
          // Check if already friends (accepted status)
          const { data: friendship } = await supabase
            .from("friendships")
            .select("*")
            .or(
              `requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`
            )
            .or(
              `requester_id.eq.${user.user_id},addressee_id.eq.${user.user_id}`
            )
            .eq("status", "accepted")
            .single();

          // Check if friend request sent (pending status where current user is requester)
          const { data: sentRequest } = await supabase
            .from("friendships")
            .select("*")
            .eq("requester_id", session.user.id)
            .eq("addressee_id", user.user_id)
            .eq("status", "pending")
            .single();

          // Check if friend request received (pending status where current user is addressee)
          const { data: receivedRequest } = await supabase
            .from("friendships")
            .select("*")
            .eq("requester_id", user.user_id)
            .eq("addressee_id", session.user.id)
            .eq("status", "pending")
            .single();

          return {
            user: {
              id: user.user_id,
              display_name: user.display_name,
              created_at: user.created_at,
            },
            isFriend: !!friendship,
            requestSent: !!sentRequest,
            requestReceived: !!receivedRequest,
          };
        })
      );

      setSearchResults(resultsWithStatus);
    } catch (error) {
      console.log("Error in searchUsers:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    if (!session?.user) return;

    setLoading(true);
    try {
      // Insert new friendship with pending status
      const { error } = await supabase.from("friendships").insert({
        requester_id: session.user.id,
        addressee_id: userId,
        status: "pending",
      });

      if (error) {
        console.log("Error sending friend request:", error);
        return;
      }

      // Update local state to show request sent
      setSearchResults((prev) =>
        prev.map((result) =>
          result.user.id === userId ? { ...result, requestSent: true } : result
        )
      );

      console.log("Friend request sent successfully");
    } catch (error) {
      console.log("Error sending friend request:", error);
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (userId: string) => {
    if (!session?.user) return;

    setLoading(true);
    try {
      // Update friendship status to accepted
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("requester_id", userId)
        .eq("addressee_id", session.user.id)
        .eq("status", "pending");

      if (error) {
        console.log("Error accepting friend request:", error);
        return;
      }

      // Update local state
      setSearchResults((prev) =>
        prev.map((result) =>
          result.user.id === userId
            ? { ...result, isFriend: true, requestReceived: false }
            : result
        )
      );

      // Remove from friend requests list
      setFriendRequests((prev) =>
        prev.filter((req) => req.requester_id !== userId)
      );

      console.log("Friend request accepted successfully");
    } catch (error) {
      console.log("Error accepting friend request:", error);
    } finally {
      setLoading(false);
    }
  };

  const rejectFriendRequest = async (userId: string) => {
    if (!session?.user) return;

    setLoading(true);
    try {
      // Update friendship status to rejected
      const { error } = await supabase
        .from("friendships")
        .update({ status: "rejected" })
        .eq("requester_id", userId)
        .eq("addressee_id", session.user.id)
        .eq("status", "pending");

      if (error) {
        console.log("Error rejecting friend request:", error);
        return;
      }

      // Remove from friend requests list
      setFriendRequests((prev) =>
        prev.filter((req) => req.requester_id !== userId)
      );

      console.log("Friend request rejected successfully");
    } catch (error) {
      console.log("Error rejecting friend request:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
      <View className="flex-1">
        <Text className="text-base font-medium">{item.user.display_name}</Text>
        <Text className="text-sm text-gray-500">
          Joined {new Date(item.user.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        {item.isFriend ? (
          <Text className="text-sm text-green-600 font-medium">Friends</Text>
        ) : item.requestSent ? (
          <Text className="text-sm text-gray-500">Sent Friend Request</Text>
        ) : item.requestReceived ? (
          <TouchableOpacity
            onPress={() => acceptFriendRequest(item.user.id)}
            disabled={loading}
            className="bg-green-500 px-3 py-1 rounded-full"
          >
            <Text className="text-white text-sm font-medium">Accept+</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => sendFriendRequest(item.user.id)}
            disabled={loading}
            className="bg-blue-500 px-3 py-1 rounded-full"
          >
            <Text className="text-white text-sm font-medium">
              Send Friend Request+
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
      <View className="flex-1">
        <Text className="text-base font-medium">
          {item.requester.display_name}
        </Text>
        <Text className="text-sm text-gray-500">
          Requested {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={() => rejectFriendRequest(item.requester_id)}
          disabled={loading}
          className="bg-red-500 px-3 py-1 rounded-full"
        >
          <Text className="text-white text-sm font-medium">Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => acceptFriendRequest(item.requester_id)}
          disabled={loading}
          className="bg-green-500 px-3 py-1 rounded-full"
        >
          <Text className="text-white text-sm font-medium">Accept+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/(user)/add-friends");
      fetchFriendRequests();
    }, [])
  );

  return (
    <View className="flex-1 px-4">
      {/* Search Bar */}
      <View className="py-4">
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
          placeholder="Search users by name..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.trim()) {
              searchUsers(text);
            } else {
              setSearchResults([]);
            }
          }}
          autoCapitalize="words"
        />
      </View>

      {/* Friend Requests Tab */}
      <TouchableOpacity
        onPress={() => {
          fetchFriendRequests();
          setShowFriendRequestsModal(true);
        }}
        className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-blue-800 font-medium text-base">
            Friend Requests
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-blue-600 text-sm">
              {friendRequests.length} pending
            </Text>
            <Text className="text-blue-500">→</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Search Results */}
      {searching ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="mt-2 text-gray-600">Searching...</Text>
        </View>
      ) : searchQuery.trim() && searchResults.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">No users found</Text>
        </View>
      ) : searchQuery.trim() ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.user.id}
          renderItem={renderSearchResult}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">
            Search for users by name to add as friends
          </Text>
        </View>
      )}

      {/* Friend Requests Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFriendRequestsModal}
        onRequestClose={() => setShowFriendRequestsModal(false)}
      >
        <View className="flex-1 bg-transparent bg-opacity-50">
          <Pressable
            className="flex-1"
            onPress={() => setShowFriendRequestsModal(false)}
          />
          <View className="bg-white rounded-t-3xl p-6 h-[85%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold">Friend Requests</Text>
              <TouchableOpacity
                onPress={() => setShowFriendRequestsModal(false)}
                className="p-2"
              >
                <Text className="text-gray-500 text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            {loadingRequests ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
                <Text className="mt-2 text-gray-600">Loading...</Text>
              </View>
            ) : friendRequests.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-600 text-center">
                  No pending friend requests
                </Text>
              </View>
            ) : (
              <FlatList
                data={friendRequests}
                keyExtractor={(item) => item.id}
                renderItem={renderFriendRequest}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
