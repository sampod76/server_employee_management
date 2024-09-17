import { model, PipelineStage, Schema, Types } from 'mongoose';

import {
  ENUM_STATUS,
  ENUM_YN,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../global/enum_constant_type';
import { mongooseFileSchema } from '../../../global/schema/global.schema';
import { mongooseIUserRef } from '../allUser/typesAndConst';
import { ChatMessageModel, IChatMessage } from './messages.interface';

const ChatMessageSchema = new Schema<IChatMessage, ChatMessageModel>(
  {
    sender: mongooseIUserRef,
    receiver: mongooseIUserRef,
    message: String,
    friendShipId: {
      type: Schema.Types.ObjectId,
      ref: 'FriendShip',
    },
    files: [mongooseFileSchema],
    isSeen: {
      type: String,
      enum: YN_ARRAY,
      default: ENUM_YN.NO,
    },
    status: {
      type: String,
      enum: STATUS_ARRAY,
      default: ENUM_STATUS.ACTIVE,
    },
    isDelete: {
      type: String,
      enum: YN_ARRAY,
      default: ENUM_YN.NO,
    },
    //--- for --TrashCategory---
  },
  {
    timestamps: true,
  },
);
ChatMessageSchema.statics.isChatMessageExistMethod = async function (
  id: string,
  option?: {
    isDelete?: boolean;
    populate?: boolean;
  },
): Promise<IChatMessage | null> {
  let data;
  if (!option?.populate) {
    const result = await ChatMessage.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDelete: option?.isDelete || ENUM_YN.NO,
        },
      },
    ]);
    data = result[0];
  } else {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDelete: option.isDelete || false,
        },
      },
    ];

    const result = await ChatMessage.aggregate(pipeline);

    data = result[0];
  }
  return data;
};
// before save then data then call this hook
/*
 ChatMessageSchema.pre('save', async function (next) {
  try {
    const ChatMessage = this;
    const MessageModel = this.constructor as MessageModel; // Explicit cast
    const existing = await MessageModel.findOne({
      licenseNumber: ChatMessage.licenseNumber,
    });

    next();
  } catch (error: any) {
    next(error);
  }
}); 
*/
export const ChatMessage = model<IChatMessage, ChatMessageModel>(
  'ChatMessage',
  ChatMessageSchema,
);
