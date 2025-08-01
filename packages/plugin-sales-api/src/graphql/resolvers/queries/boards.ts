import { BOARD_STATUSES } from "../../../models/definitions/constants";
import { paginate, regexSearchText } from "@erxes/api-utils/src";
import { moduleRequireLogin } from "@erxes/api-utils/src/permissions";
import { getCollection } from "../../../models/utils";
import { IStageDocument } from "../../../models/definitions/boards";
import { CLOSE_DATE_TYPES, PRIORITIES } from "../../../constants";
import { IPipelineLabelDocument } from "../../../models/definitions/pipelineLabels";
import { getCloseDateByType } from "./utils";
import { fetchSegment, sendCoreMessage } from "../../../messageBroker";
import { IContext } from "../../../connectionResolver";
import { getContentTypeDetail } from "../../../utils";
import { IUserDocument } from "@erxes/api-utils/src/types";

export interface IIntervals {
  startTime: string;
  endTime: string;
}

export interface IDate {
  month: number;
  year: number;
}

export interface IConformityQueryParams {
  conformityMainType?: string;
  conformityMainTypeId?: string;
  conformityIsRelated?: boolean;
  conformityIsSaved?: boolean;
}

export interface IListParams extends IConformityQueryParams {
  pipelineId: string;
  pipelineIds: string[];
  page: number;
  perPage: number;
  stageId: string;
  _ids?: string;
  skip?: number;
  limit?: number;
  date?: IDate;
  search?: string;
  customerIds?: string[];
  companyIds?: string[];
  assignedUserIds?: string[];
  sortField?: string;
  sortDirection?: number;
  labelIds?: string[];
  userIds?: string[];
  segment?: string;
  segmentData?: string;
  stageChangedStartDate?: Date;
  stageChangedEndDate?: Date;
  noSkipArchive?: boolean;
  tagIds?: string[];
  number?: string;
}

const boardQueries = {
  /**
   *  Boards list
   */
  async salesBoards(
    _root,
    { type }: { type: string },
    { user, commonQuerySelector, models: { Boards }, res, subdomain }: IContext
  ) {
    return await Boards.find({ ...commonQuerySelector }).lean();
  },

  /**
   *  Boards count
   */
  async salesBoardCounts(
    _root,
    { type }: { type: string },
    { commonQuerySelector, models: { Boards, Pipelines } }: IContext
  ) {
    const boards = await Boards.find({ ...commonQuerySelector, type })
      .sort({
        name: 1
      })
      .lean();

    const counts: Array<{ _id: string; name: string; count: number }> = [];

    let allCount = 0;

    for (const board of boards) {
      const count = await Pipelines.find({
        boardId: board._id
      }).countDocuments();

      counts.push({
        _id: board._id,
        name: board.name || "",
        count
      });

      allCount += count;
    }

    counts.unshift({ _id: "", name: "All", count: allCount });

    return counts;
  },

  /**
   *  Board detail
   */
  async salesBoardDetail(
    _root,
    { _id }: { _id: string },
    { commonQuerySelector, models: { Boards } }: IContext
  ) {
    return Boards.findOne({ ...commonQuerySelector, _id }).lean();
  },

  /**
   * Get last board
   */
  async salesBoardGetLast(
    _root,
    { type }: { type: string },
    { commonQuerySelector, models: { Boards } }: IContext
  ) {
    return Boards.findOne({ ...commonQuerySelector, type })
      .sort({
        createdAt: -1
      })
      .lean();
  },

  /**
   *  Pipelines list
   */
  async salesPipelines(
    _root,
    {
      boardId,
      type,
      isAll,
      ...queryParams
    }: {
      boardId: string;
      type: string;
      isAll: boolean;
      page: number;
      perPage: number;
    },
    { user, models: { Pipelines }, subdomain }: IContext
  ) {
    const query: any =
      user.isOwner || isAll
        ? {}
        : {
          status: { $ne: "archived" },
          $or: [
            { visibility: "public" },
            {
              $and: [
                { visibility: "private" },
                {
                  $or: [
                    { memberIds: { $in: [user._id] } },
                    { userId: user._id }
                  ]
                }
              ]
            }
          ]
        };

    if (!user.isOwner && !isAll) {
      const userDetail = await sendCoreMessage({
        subdomain,
        action: "users.find",
        data: {
          _id: user._id
        },
        isRPC: true,
        defaultValue: []
      });

      const departmentIds = userDetail?.departmentIds || [];

      if (Object.keys(query) && departmentIds.length > 0) {
        query.$or.push({
          $and: [
            { visibility: "private" },
            { departmentIds: { $in: departmentIds } }
          ]
        });
      }
    }

    const { page, perPage } = queryParams;

    if (boardId) {
      query.boardId = boardId;
    }

    if (type) {
      query.type = type;
    }

    if (page && perPage) {
      return paginate(
        Pipelines.find(query).sort({ createdAt: 1 }),
        queryParams
      );
    }

    return Pipelines.find(query).sort({ order: 1, createdAt: -1 }).lean();
  },

  async salesPipelineStateCount(
    _root,
    { boardId, type }: { boardId: string; type: string },
    { models: { Pipelines } }: IContext
  ) {
    const query: any = {};

    if (boardId) {
      query.boardId = boardId;
    }

    if (type) {
      query.type = type;
    }

    const counts: any = {};
    const now = new Date();

    const notStartedQuery = {
      ...query,
      startDate: { $gt: now }
    };

    const notStartedCount =
      await Pipelines.find(notStartedQuery).countDocuments();

    counts["Not started"] = notStartedCount;

    const inProgressQuery = {
      ...query,
      startDate: { $lt: now },
      endDate: { $gt: now }
    };

    const inProgressCount =
      await Pipelines.find(inProgressQuery).countDocuments();

    counts["In progress"] = inProgressCount;

    const completedQuery = {
      ...query,
      endDate: { $lt: now }
    };

    const completedCounted =
      await Pipelines.find(completedQuery).countDocuments();

    counts.Completed = completedCounted;

    counts.All = notStartedCount + inProgressCount + completedCounted;

    return counts;
  },

  /**
   *  Pipeline detail
   */
  async salesPipelineDetail(
    _root,
    { _id }: { _id: string },
    { models: { Pipelines } }: IContext
  ) {
    return Pipelines.findOne({ _id }).lean();
  },

  /**
   *  Pipeline related assigned users
   */
  async salesPipelineAssignedUsers(
    _root,
    { _id }: { _id: string },
    { models }: IContext
  ) {
    const pipeline = await models.Pipelines.getPipeline(_id);
    const stageIds = await models.Stages.find({
      pipelineId: pipeline._id
    }).distinct("_id");

    const { collection } = getCollection(models, pipeline.type);

    const assignedUserIds = await collection
      .find({ stageId: { $in: stageIds } })
      .distinct("assignedUserIds");

    return assignedUserIds.map(userId => ({
      __typename: "User",
      _id: userId || ""
    }));
  },

  /**
   *  Stages list
   */
  async salesStages(
    _root,
    {
      pipelineId,
      pipelineIds,
      isNotLost,
      isAll
    }: {
      pipelineId: string;
      pipelineIds: string[];
      isNotLost: boolean;
      isAll: boolean;
    },
    { user, models: { Stages }, subdomain }: IContext
  ) {
    const filter: any = {};

    filter.pipelineId = pipelineId;

    if (pipelineIds) {
      filter.pipelineId = { $in: pipelineIds };
    }

    if (isNotLost) {
      filter.probability = { $ne: "Lost" };
    }

    if (!isAll) {
      filter.status = { $ne: BOARD_STATUSES.ARCHIVED };

      filter.$or = [
        { visibility: { $in: ["public", null] } },
        {
          $and: [{ visibility: "private" }, { memberIds: { $in: [user._id] } }]
        }
      ];

      const userDetail = await sendCoreMessage({
        subdomain,
        action: "users.findOne",
        data: {
          _id: user._id
        },
        isRPC: true,
        defaultValue: []
      });

      const departmentIds = userDetail?.departmentIds || [];
      if (departmentIds.length > 0) {
        filter.$or.push({
          $and: [
            { visibility: "private" },
            { departmentIds: { $in: departmentIds } }
          ]
        });
      }
    }

    return Stages.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  },

  async salesItemsCountByAssignedUser(
    _root,
    {
      pipelineId,
      type,
      stackBy
    }: { pipelineId: string; type: string; stackBy: string },
    { models, subdomain }: IContext
  ) {
    const { Stages, PipelineLabels } = models;

    let groups;
    let detailFilter;

    const stages = await Stages.find({ pipelineId });

    if (stages.length === 0) {
      return {};
    }

    const stageIds = stages.map(stage => stage._id);

    const filter: any = {
      stageId: { $in: stageIds },
      status: BOARD_STATUSES.ACTIVE
    };

    switch (stackBy) {
      case "priority": {
        groups = PRIORITIES.ALL;

        filter.priority = { $in: PRIORITIES.ALL.map(p => p.name) };

        detailFilter = ({ name }: { name: string }) => ({
          priority: name,
          stageId: { $in: stageIds }
        });

        break;
      }

      case "label": {
        const labels = await PipelineLabels.find({ pipelineId });
        groups = labels.map(label => ({
          _id: label._id,
          name: label.name,
          color: label.colorCode
        }));

        filter.labelIds = { $in: labels.map(g => g._id) };

        detailFilter = (label: IPipelineLabelDocument) => ({
          labelIds: { $in: [label._id] },
          stageId: { $in: stageIds }
        });

        break;
      }

      case "dueDate": {
        groups = CLOSE_DATE_TYPES.ALL;

        detailFilter = ({ value }: { value: string }) => ({
          closeDate: getCloseDateByType(value),
          stageId: { $in: stageIds }
        });

        break;
      }

      // when stage
      default: {
        groups = stages.map(stage => ({
          _id: stage._id,
          name: stage.name
        }));

        detailFilter = (stage: IStageDocument) => ({ stageId: stage._id });
      }
    }

    const { collection } = getCollection(models, type);

    const assignedUserIds = await collection
      .find(filter)
      .distinct("assignedUserIds");

    if (assignedUserIds.length === 0) {
      return {};
    }

    const users = await sendCoreMessage({
      subdomain,
      action: "users.find",
      data: {
        query: {
          _id: { $in: assignedUserIds }
        }
      },
      isRPC: true,
      defaultValue: []
    });

    const usersWithInfo: Array<{ name: string }> = [];
    const countsByGroup = {};

    for (const groupItem of groups) {
      const countsByGroupItem = await collection.find({
        "assignedUserIds.0": { $exists: true },
        status: BOARD_STATUSES.ACTIVE,
        ...detailFilter(groupItem)
      });

      countsByGroup[groupItem.name || ""] = countsByGroupItem;
    }

    for (const user of users) {
      const groupWithCount = {};

      for (const groupItem of groups) {
        groupWithCount[groupItem.name || ""] = countsByGroup[
          groupItem.name || ""
        ].filter(item =>
          (item.assignedUserIds || []).includes(user._id)
        ).length;
      }

      usersWithInfo.push({
        name: user.details
          ? user.details.fullName || user.email || "No name"
          : "No name",
        ...groupWithCount
      });
    }

    return {
      usersWithInfo,
      groups
    };
  },

  /**
   *  Stage detail
   */
  async salesStageDetail(
    _root,
    { _id }: { _id: string },
    { models: { Stages } }: IContext
  ) {
    return Stages.findOne({ _id }).lean();
  },

  /**
   *  Archived stages
   */

  async salesArchivedStages(
    _root,
    {
      pipelineId,
      search,
      ...listArgs
    }: { pipelineId: string; search?: string; page?: number; perPage?: number },
    { models: { Stages } }: IContext
  ) {
    const filter: any = { pipelineId, status: BOARD_STATUSES.ARCHIVED };

    if (search) {
      Object.assign(filter, regexSearchText(search, "name"));
    }

    return paginate(Stages.find(filter).sort({ createdAt: -1 }), listArgs);
  },

  async salesArchivedStagesCount(
    _root,
    { pipelineId, search }: { pipelineId: string; search?: string },
    { models: { Stages } }: IContext
  ) {
    const filter: any = { pipelineId, status: BOARD_STATUSES.ARCHIVED };

    if (search) {
      Object.assign(filter, regexSearchText(search, "name"));
    }

    return Stages.countDocuments(filter);
  },

  /**
   *  ConvertTo info
   */
  async salesConvertToInfo(
    _root,
    { conversationId }: { conversationId: string },
    { models: { Deals, Stages, Pipelines, Boards } }: IContext
  ) {
    const filter = { sourceConversationIds: { $in: [conversationId] } };
    let dealUrl = "";

    const deal = await Deals.findOne(filter).lean();

    if (deal) {
      const stage = await Stages.getStage(deal.stageId);
      const pipeline = await Pipelines.getPipeline(stage.pipelineId);
      const board = await Boards.getBoard(pipeline.boardId);

      dealUrl = `/deal/board?id=${board._id}&pipelineId=${pipeline._id}&itemId=${deal._id}`;
    }

    return {
      dealUrl
    };
  },

  async salesItemsCountBySegments(
    _root,
    {
      type,
      boardId,
      pipelineId
    }: { type: string; boardId: string; pipelineId: string },
    { subdomain }: IContext
  ) {
    const segments = await sendCoreMessage({
      subdomain,
      action: "segmentFind",
      data: {
        contentType: type,
        config: {
          boardId,
          pipelineId
        }
      },
      isRPC: true,
      defaultValue: []
    });

    const counts = {};

    for (const segment of segments) {
      counts[segment._id] = await fetchSegment(subdomain, segment._id, {
        pipelineId,
        returnCount: true
      });
    }

    return counts;
  },

  async salesBoardContentTypeDetail(_root, args, { subdomain }: IContext) {
    return getContentTypeDetail(subdomain, args);
  },

  async salesBoardLogs(_root, args, { subdomain, models }: IContext) {
    const { Deals, Stages } = models;
    const { action, content, contentType, contentId } = args;

    const type = contentType.split(":")[0];

    if (action === "moved") {
      let item = {};

      switch (type) {
        case "deal":
          item = await Deals.getDeal(contentId);
          break;

        default:
          break;
      }

      const { oldStageId, destinationStageId } = content;

      const destinationStage = await Stages.findOne({
        _id: destinationStageId
      }).lean();

      const oldStage = await Stages.findOne({ _id: oldStageId }).lean();

      if (destinationStage && oldStage) {
        return {
          destinationStage: destinationStage.name,
          oldStage: oldStage.name,
          item
        };
      }

      return {
        text: content.text
      };
    }

    if (action === "assignee") {
      let addedUsers: IUserDocument[] = [];
      let removedUsers: IUserDocument[] = [];

      if (content) {
        addedUsers = content.addedUserIds?.length ? await sendCoreMessage({
          subdomain,
          action: "users.find",
          data: {
            query: {
              _id: { $in: content.addedUserIds }
            }
          },
          isRPC: true,
          defaultValue: []
        }) : [];

        removedUsers = content.removedUserIds?.length ? await sendCoreMessage({
          subdomain,
          action: "users.find",
          data: {
            query: {
              _id: { $in: content.removedUserIds }
            }
          },
          isRPC: true,
          defaultValue: []
        }) : [];
      }

      return { addedUsers, removedUsers };
    }
  },

  async salesCardsFields(_root, _args, { models, subdomain }: IContext) {
    const result = {};

    for (const ct of ["deal"]) {
      result[ct] = [];

      const groups = await sendCoreMessage({
        subdomain,
        action: "fieldsGroups.find",
        data: {
          query: {
            contentType: `sales:${ct}`
          }
        },
        isRPC: true
      });

      for (const group of groups) {
        const { config = {} } = group;

        const fields = await sendCoreMessage({
          subdomain,
          action: "fields.find",
          data: {
            query: {
              groupId: group._id
            }
          },
          isRPC: true
        });

        const pipelines = await models.Pipelines.find({
          _id: { $in: config.pipelineIds || [] }
        });

        for (const pipeline of pipelines) {
          const board = await models.Boards.getBoard(pipeline.boardId);

          for (const field of fields) {
            result[ct].push({
              boardName: board.name,
              pipelineName: pipeline.name,
              fieldId: field._id,
              fieldName: field.text
            });
          }
        }
      }
    }

    return result;
  },

  async salesCheckFreeTimes(
    _root,
    { pipelineId, intervals },
    { models, subdomain }: IContext
  ) {
    if (!intervals.length) {
      return [];
    }

    const timezone = Number(process.env.TIMEZONE || 0) * 1000 * 60 * 60;

    const pipeline = await models.Pipelines.getPipeline(pipelineId);

    const latestStartDate = new Date(
      intervals[0].startTime.getTime() - timezone
    );

    const latestEndDate = new Date(
      intervals[intervals.length - 1].endTime.getTime() - timezone
    );

    if (!pipeline.tagId) {
      return intervals;
    }

    const tags = await sendCoreMessage({
      subdomain,
      action: "tagWithChilds",
      data: {
        query: {
          _id: pipeline.tagId
        },
        fields: {
          _id: 1
        }
      },
      isRPC: true
    });

    const stages = await models.Stages.find({ pipelineId });

    const stageIds = stages.map(stage => stage._id);

    const items = await models.Deals.find(
      {
        status: { $ne: "archived" },
        stageId: { $in: stageIds },
        startDate: {
          $lte: latestEndDate
        },
        closeDate: {
          $gte: latestStartDate
        },
        tagIds: { $in: tags.map(t => t._id) }
      },
      { startDate: 1, closeDate: 1, tagIds: 1 }
    );

    for (const interval of intervals) {
      const startDate = new Date(interval.startTime.getTime() - timezone);

      const endDate = new Date(interval.endTime.getTime() - timezone);

      const checkingItems = items.filter(
        item =>
          item.startDate &&
          item.startDate < endDate &&
          item.closeDate &&
          item.closeDate > startDate
      );

      let checkedTagIds: string[] = [];

      for (const item of checkingItems) {
        checkedTagIds = checkedTagIds.concat(item.tagIds || []);
      }

      interval.freeTags = tags.filter(t => !checkedTagIds.includes(t._id));
    }

    return intervals;
  }
};

moduleRequireLogin(boardQueries);

export default boardQueries;
