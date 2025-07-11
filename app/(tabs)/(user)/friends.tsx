import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

interface Friend {
  id: string;
  email: string;
  displayName: string;
  joinedDate: string;
}

const FriendItem = ({ item }: { item: Friend }) => (
  <TouchableOpacity
    className="flex-row items-center mb-3 ml-4"
    onPress={() => {
      // Navigate to friend's profile or chat
      console.log("Navigate to friend:", item.email);
    }}
  >
    <View className="w-16 h-16 rounded-full bg-gray-300 mr-4 items-center justify-center">
      <Text className="text-lg font-semibold text-gray-600">
        {item.displayName.charAt(0).toUpperCase()}
      </Text>
    </View>
    <View className="flex-1">
      <Text className="text-lg font-semibold mb-1">{item.displayName}</Text>
      <Text className="text-sm text-gray-600">{item.email}</Text>
      <Text className="text-xs text-gray-500">
        Joined {new Date(item.joinedDate).toLocaleDateString()}
      </Text>
    </View>
  </TouchableOpacity>
);

export default function FriendsScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFriends = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      // First, get all friend relationships for the current user
      const { data: friendRelationships, error: relationshipsError } =
        await supabase
          .from("user_friends")
          .select("friend_id")
          .eq("user_id", session.user.id);

      if (relationshipsError) {
        console.log("Error fetching friend relationships:", relationshipsError);
        setFriends([]);
        return;
      }

      if (!friendRelationships || friendRelationships.length === 0) {
        setFriends([]);
        return;
      }

      // Extract friend IDs
      const friendIds = friendRelationships.map((rel) => rel.friend_id);

      // Fetch friend user details
      const { data: friendUsers, error: usersError } = await supabase
        .from("auth.users")
        .select("id, email, created_at, raw_user_meta_data")
        .in("id", friendIds);

      if (usersError) {
        console.log("Error fetching friend users:", usersError);
        setFriends([]);
        return;
      }

      // Transform the data to match our interface
      const transformedData: Friend[] = (friendUsers || []).map(
        (user: any) => ({
          id: user.id,
          email: user.email || "Unknown Email",
          displayName:
            user.raw_user_meta_data?.display_name ||
            user.email?.split("@")[0] ||
            "Unknown User",
          joinedDate: user.created_at,
        })
      );

      setFriends(transformedData);
      setFilteredFriends(transformedData);
    } catch (error) {
      console.log("Unexpected error fetching friends:", error);
      setFriends([]);
      setFilteredFriends([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter friends based on search query
  const filterFriends = (query: string) => {
    if (!query.trim()) {
      setFilteredFriends(friends);
      return;
    }

    const filtered = friends.filter(
      (friend) =>
        friend.displayName.toLowerCase().includes(query.toLowerCase()) ||
        friend.email.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredFriends(filtered);
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/(user)/friends");
      if (session) {
        fetchFriends();
      }
    }, [session])
  );

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

  return (
    <ScrollView className="flex-1 bg-transparent">
      {/* Search Bar */}
      <View className="px-4 py-4">
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
          placeholder="Search friends..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            filterFriends(text);
          }}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center py-20">
          <ActivityIndicator size="large" />
          <Text className="mt-2 text-gray-600">Loading friends...</Text>
        </View>
      ) : friends.length === 0 ? (
        <View className="flex-1 justify-center items-center py-20">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            No Friends Yet
          </Text>
          <Text className="text-gray-600 text-center px-8">
            Start adding friends from the add friends page to see them here
          </Text>
        </View>
      ) : (
        <View className="space-y-2">
          {filteredFriends.map((friend) => (
            <FriendItem key={friend.id} item={friend} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
