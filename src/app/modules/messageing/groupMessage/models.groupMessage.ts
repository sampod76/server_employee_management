import { model, PipelineStage, Schema, Types } from 'mongoose';

import {
  ENUM_STATUS,
  STATUS_ARRAY,
} from '../../../../global/enum_constant_type';
import { mongooseFileSchema } from '../../../../global/schema/global.schema';
import { mongooseIUserRef } from '../../allUser/typesAndConst';
import { GroupMessageModel, IGroupMessage } from './interface.groupMessage';

const GroupMessageSchema = new Schema<IGroupMessage, GroupMessageModel>(
  {
    sender: mongooseIUserRef,
    // receiver: mongooseIUserRef,
    message: String,
    groupMemberId: {
      type: Schema.Types.ObjectId,
      ref: 'GroupMember',
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    uuid: {
      type: String,
    },
    files: [mongooseFileSchema],
    isSeen: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: STATUS_ARRAY,
      default: ENUM_STATUS.ACTIVE,
    },
    createTime: {
      type: Date,
      default: Date.now(),
    },
    isDelete: {
      type: Boolean,
      default: false,
      index: true,
    },
    //--- for --TrashCategory---
  },
  {
    timestamps: true,
  },
);
GroupMessageSchema.statics.isGroupMessageExistMethod = async function (
  id: string,
  option?: {
    isDelete?: boolean;
    populate?: boolean;
  },
): Promise<IGroupMessage | null> {
  let data;
  if (!option?.populate) {
    const result = await GroupMessage.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDelete: option?.isDelete || false,
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

    const result = await GroupMessage.aggregate(pipeline);

    data = result[0];
  }
  return data;
};
// before save then data then call this hook
/*
 GroupMessageSchema.pre('save', async function (next) {
  try {
    const GroupMessage = this;
    const MessageModel = this.constructor as MessageModel; // Explicit cast
    const existing = await MessageModel.findOne({
      licenseNumber: GroupMessage.licenseNumber,
    });

    next();
  } catch (error: any) {
    next(error);
  }
}); 
*/
export const GroupMessage = model<IGroupMessage, GroupMessageModel>(
  'GroupMessage',
  GroupMessageSchema,
);
