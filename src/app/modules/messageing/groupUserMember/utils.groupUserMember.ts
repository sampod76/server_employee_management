import { PipelineStage, Types } from 'mongoose';
import { LookupAnyRoleDetailsReusable } from '../../../../helper/lookUpResuable';
import { ENUM_REDIS_KEY } from '../../../redis/consent.redis';
import { redisClient } from '../../../redis/redis';
import { IGroupMember } from './interface.groupUserMember';
import { GroupMember } from './models.groupUserMember';
type GroupMemberOptions = {
  needGroup?: boolean;
  validateUserId?: string;
};
export const findGroupMemberInRedisOrDb = async (
  groupMemberId: string,
  option: GroupMemberOptions,
) => {
  try {
    let result;
    const redisData = await redisClient.get(
      ENUM_REDIS_KEY.REDIS_IN_SAVE_GroupMemberAndUserId +
        option.validateUserId +
        ':' +
        groupMemberId,
    );
    if (redisData) {
      result = JSON.parse(redisData) as IGroupMember;
    } else {
      const pipeline: PipelineStage[] = [
        {
          $match: {
            _id: new Types.ObjectId(groupMemberId),
            isDelete: false,
          },
        },
      ];

      LookupAnyRoleDetailsReusable(pipeline, {
        collections: [
          {
            roleMatchFiledName: 'receiver.role',
            idFiledName: 'receiver.roleBaseUserId', //$receiver.roleBaseUserId
            pipeLineMatchField: '_id', //$_id
            outPutFieldName: 'details',
            margeInField: 'receiver',
            project: { name: 1, country: 1, profileImage: 1, email: 1 },
          },
        ],
      });
      const getGroup = await GroupMember.aggregate(pipeline);
      result = getGroup[0];
      if (result) {
        await redisClient.set(
          ENUM_REDIS_KEY.REDIS_IN_SAVE_GroupMemberAndUserId +
            option.validateUserId +
            ':' +
            groupMemberId,
          JSON.stringify(result),
          'EX',
          24 * 60 * 60, // 1 day to second
        );
      }
    }

    if (option.validateUserId) {
      if (
        result?.receiver?.userId?.toString() !==
        option?.validateUserId?.toString()
      ) {
        throw new Error('forbidden access');
      }
    }
    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
