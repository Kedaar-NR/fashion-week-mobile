import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface SearchResult {
  user: User;
  isFriend: boolean;
  requestSent: boolean;
  requestReceived: boolean;
}

export default function AddFriendsScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

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

  const searchUsers = async (query: string) => {
    if (!session?.user || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Search for users by email (excluding current user)
      const { data: users, error } = await supabase
        .from("auth.users")
        .select("id, email, created_at")
        .ilike("email", `%${query}%`)
        .neq("id", session.user.id)
        .limit(20);

      if (error) {
        console.log("Error searching users:", error);
        setSearchResults([]);
        return;
      }

      // For each user, check friendship status
      const resultsWithStatus = await Promise.all(
        (users || []).map(async (user) => {
          // Check if already friends
          const { data: friendship } = await supabase
            .from("friendships")
            .select("*")
            .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .eq("status", "accepted")
            .single();

          // Check if friend request sent
          const { data: sentRequest } = await supabase
            .from("friend_requests")
            .select("*")
            .eq("sender_id", session.user.id)
            .eq("receiver_id", user.id)
            .eq("status", "pending")
            .single();

          // Check if friend request received
          const { data: receivedRequest } = await supabase
            .from("friend_requests")
            .select("*")
            .eq("sender_id", user.id)
            .eq("receiver_id", session.user.id)
            .eq("status", "pending")
            .single();

          return {
            user,
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
      const { error } = await supabase.from("friend_requests").insert({
        sender_id: session.user.id,
        receiver_id: userId,
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
      // Update friend request status to accepted
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("sender_id", userId)
        .eq("receiver_id", session.user.id)
        .eq("status", "pending");

      if (updateError) {
        console.log("Error accepting friend request:", updateError);
        return;
      }

      // Create friendship record
      const { error: friendshipError } = await supabase
        .from("friendships")
        .insert({
          user1_id: session.user.id,
          user2_id: userId,
          status: "accepted",
        });

      if (friendshipError) {
        console.log("Error creating friendship:", friendshipError);
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

      console.log("Friend request accepted successfully");
    } catch (error) {
      console.log("Error accepting friend request:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
      <View className="flex-1">
        <Text className="text-base font-medium">{item.user.email}</Text>
        <Text className="text-sm text-gray-500">
          Joined {new Date(item.user.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        {item.isFriend ? (
          <Text className="text-sm text-green-600 font-medium">Friends</Text>
        ) : item.requestSent ? (
          <Text className="text-sm text-gray-500">Request Sent</Text>
        ) : item.requestReceived ? (
          <TouchableOpacity
            onPress={() => acceptFriendRequest(item.user.id)}
            disabled={loading}
            className="bg-blue-500 px-3 py-1 rounded-full"
          >
            <Text className="text-white text-sm font-medium">Accept</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => sendFriendRequest(item.user.id)}
            disabled={loading}
            className="bg-blue-500 px-3 py-1 rounded-full"
          >
            <Text className="text-white text-sm font-medium">Add Friend</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/(user)/add-friends");
    }, [])
  );

  return (
    <View className="flex-1 px-4">
      {/* Search Bar */}
      <View className="py-4">
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.trim()) {
              searchUsers(text);
            } else {
              setSearchResults([]);
            }
          }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

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
            Search for users to add as friends
          </Text>
        </View>
      )}
    </View>
  );
}
