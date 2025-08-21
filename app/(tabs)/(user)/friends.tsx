import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
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

interface Friend {
  id: string;
  friend_id: string;
  friend: {
    display_name: string;
    created_at: string;
  };
  friendship_created_at: string;
}

export default function FriendsScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);

  useEffect(() => {
    console.log("🚀 Setting up auth listeners...");

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("📱 Initial session loaded:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
      });
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("🔄 Auth state changed:", {
          event: _event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
        });
        setSession(session);
      }
    );

    return () => {
      console.log("🧹 Cleaning up auth listeners");
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchFriends = async () => {
    console.log("🔍 fetchFriends called with session:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
    });

    if (!session?.user) {
      console.log("❌ No session or user found");
      return;
    }

    console.log("🔍 Fetching friends for user:", session.user.id);
    setLoading(true);

    try {
      // Get all accepted friendships where current user is either requester or addressee
      console.log("📡 Querying friendships table...");
      console.log(
        "📍 Query filters: status='accepted', user_id in [requester_id, addressee_id]"
      );

      // First, get the friendships without the join
      const { data: friendships, error } = await supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, created_at")
        .eq("status", "accepted")
        .or(
          `requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`
        )
        .order("created_at", { ascending: false });

      console.log("📊 Raw query result:", { friendships, error });

      if (error) {
        console.log("❌ Error fetching friends:", error);
        console.log("🔍 Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        setFriends([]);
        return;
      }

      console.log(
        "✅ Query successful, found",
        friendships?.length || 0,
        "friendships"
      );

      if (friendships && friendships.length > 0) {
        console.log("📋 First friendship sample:", friendships[0]);
      }

      // Transform the data to show friend information
      const transformedFriends = await Promise.all(
        (friendships || []).map(async (friendship: any) => {
          const isRequester = friendship.requester_id === session.user.id;
          const friendUserId = isRequester
            ? friendship.addressee_id
            : friendship.requester_id;

          console.log("🔄 Processing friendship:", {
            friendship_id: friendship.id,
            requester_id: friendship.requester_id,
            addressee_id: friendship.addressee_id,
            current_user_id: session.user.id,
            isRequester,
            friendUserId,
          });

          // Fetch the friend's profile separately
          const { data: friendProfile, error: profileError } = await supabase
            .from("user_profiles")
            .select("display_name, created_at")
            .eq("user_id", friendUserId)
            .single();

          if (profileError) {
            console.log("⚠️ Error fetching friend profile:", profileError);
          }

          return {
            id: friendship.id,
            friend_id: friendUserId,
            friend: {
              display_name: friendProfile?.display_name || "Unknown User",
              created_at: friendProfile?.created_at || friendship.created_at,
            },
            friendship_created_at: friendship.created_at,
          };
        })
      );

      console.log("🎯 Transformed friends:", transformedFriends);
      setFriends(transformedFriends);
    } catch (error) {
      console.log("💥 Unexpected error in fetchFriends:", error);
      console.log(
        "🔍 Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      setFriends([]);
    } finally {
      setLoading(false);
      console.log("🏁 fetchFriends completed");
    }
  };

  const removeFriend = async (friendshipId: string) => {
    if (!session?.user) {
      console.log("❌ No session or user found for removeFriend");
      return;
    }

    console.log("🗑️ Removing friendship:", friendshipId);
    setLoading(true);

    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) {
        console.log("❌ Error removing friend:", error);
        console.log("🔍 Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        return;
      }

      console.log("✅ Friend removed successfully from database");

      // Remove from local state
      setFriends((prev) => prev.filter((friend) => friend.id !== friendshipId));
      console.log("🔄 Updated local state, removed friendship:", friendshipId);
    } catch (error) {
      console.log("💥 Unexpected error removing friend:", error);
      console.log(
        "🔍 Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
    } finally {
      setLoading(false);
      console.log("🏁 removeFriend completed");
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      className="flex-row items-center justify-between p-4 border-b border-gray-200"
      onPress={() => {
        router.push({
          pathname: "/(tabs)/(user)/[friend]",
          params: { friend: item.friend_id },
        });
      }}
      activeOpacity={0.7}
    >
      <View className="flex-1">
        <Text className="text-base font-medium">
          {item.friend.display_name}
        </Text>
        {/* <Text className="text-sm text-gray-500">
          Friends since{" "}
          {new Date(item.friendship_created_at).toLocaleDateString()}
        </Text> */}
      </View>

      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          removeFriend(item.id);
        }}
        disabled={loading}
        className="bg-red-500 px-3 py-1 rounded-full"
      >
        <Text className="text-white text-sm font-medium">Remove</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/(user)/friends");
      console.log("🔑 Session state:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
      });

      if (session?.user) {
        fetchFriends();
      } else {
        console.log("⏳ Waiting for session to load...");
      }
    }, [session])
  );

  // Filter friends based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter((friend) =>
        friend.friend.display_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  return (
    <View className="flex-1 px-4">
      {/* Header with Search Bar */}
      <View className="py-4">
        {/* <Text className="text-2xl font-bold text-gray-800 mb-3">
          My Friends
        </Text> */}
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
          placeholder="Search friends..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="words"
        />
        {searchQuery.trim() !== "" && (
          <Text className="text-gray-600 mt-2 text-sm">
            {filteredFriends.length}{" "}
            {filteredFriends.length === 1 ? "friend" : "friends"} found
          </Text>
        )}
      </View>

      {/* Friends List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="mt-2 text-gray-600">Loading friends...</Text>
        </View>
      ) : filteredFriends.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          {searchQuery.trim() !== "" ? (
            <>
              <Text className="text-gray-600 text-center">
                No friends found matching "{searchQuery}"
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                Try a different search term
              </Text>
            </>
          ) : (
            <>
              <Text className="text-gray-600 text-center">
                You don't have any friends yet
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                Add friends from the Add Friends page
              </Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
