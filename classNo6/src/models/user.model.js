import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, //index is an optimize way to make the field searchable
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudanary url
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    password:{
        type:String,
        required:[required,"Password must be required"],
        trim:true,
        index:true,

    },
    watchHistory:[      //array because store multiple values
        {
           types: Schema.Types.ObjectId,
           ref:"Video"

        }
    ],
    refreshToken:{
      type:String,
      
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
