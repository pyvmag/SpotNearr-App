import React from "react";
import { Dimensions, Image, TouchableOpacity } from "react-native";

const { width } = Dimensions.get("window");

interface BusinessPostGridItemProps {
  post: any;
  onPress: () => void;
  isOwner: boolean;
}

export default function BusinessPostGridItem({ post, onPress, isOwner }: BusinessPostGridItemProps) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.9} 
      className="relative"
    >
      <Image 
        source={{ uri: post.imageUrl }} 
        style={{ width: width / 3, height: width / 3 }}
        className="border-[0.5px] border-white bg-gray-100"
      />
    </TouchableOpacity>
  );
}