import mongoose, { Schema } from "mongoose";
import { User } from "./user.model";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //one who is subscribbing eg. Dhruvin
      rel: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, //one to whom "subscriber" is subscribing eg: Param
      rel: "User",
    },
  },
  {
    timestamps: true,
  }
);

// therefore subscriptionSchema = Dhruvin subscribed to channel of Param

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
