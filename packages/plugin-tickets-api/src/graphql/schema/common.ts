import {
  attachmentInput,
  attachmentType,
} from "@erxes/api-utils/src/commonTypeDefs";

const ruleFields = `
  _id : String!,
  kind: String!,
  text: String!,
  condition: String!,
  value: String,
`;

export const types = `
  ${attachmentType}
  ${attachmentInput}
  type TicketsRule {
    ${ruleFields}
  }

  input TicketsOrderItem {
    _id: String!
    order: Int!
  }

  input TicketsInputRule {
    ${ruleFields}
  }
  type TicketsTimeTrack {
    status: String,
    timeSpent: Int,
    startDate: String
  }
`;

export const conformityQueryFields = `
  conformityMainType: String
  conformityMainTypeId: String
  conformityRelType: String
  conformityIsRelated: Boolean
  conformityIsSaved: Boolean
`;

export const commonTypes = `
  name: String!
  order: Float
  createdAt: Date
  hasNotified: Boolean
  assignedUserIds: [String]
  branchIds: [String]
  departmentIds:[String]
  labelIds: [String]
  startDate: Date
  closeDate: Date
  description: String
  modifiedAt: Date
  modifiedBy: String
  reminderMinute: Int,
  isComplete: Boolean,
  isWatched: Boolean,
  stageId: String
  boardId: String
  priority: String
  status: String
  attachments: [Attachment]
  userId: String
  tagIds: [String]

  assignedUsers: [User]
  stage: TicketsStage
  labels: [TicketsPipelineLabel]
  pipeline: TicketsPipeline
  createdUser: User
  customFieldsData: JSON
  score: Float
  timeTrack: TicketsTimeTrack
  number: String
  stageChangedDate: Date

  customProperties: JSON
  type: String
  isCheckUserTicket: Boolean
`;

export const commonMutationParams = `
  parentId:String,
  proccessId: String,
  aboveItemId: String,
  stageId: String,
  assignedUserIds: [String],
  attachments: [AttachmentInput],
  startDate: Date,
  closeDate: Date,
  description: String,
  order: Int,
  reminderMinute: Int,
  isComplete: Boolean,
  priority: String,
  status: String,
  sourceConversationIds: [String],
  customFieldsData: JSON,
  tagIds: [String],
  branchIds: [String],
  departmentIds: [String],
`;

export const commonDragParams = `
  itemId: String!,
  aboveItemId: String,
  destinationStageId: String!,
  sourceStageId: String,
  proccessId: String
`;

export const copyParams = `companyIds: [String], customerIds: [String], labelIds: [String]`;

export const commonListTypes = `
  _id: String!
  name: String
  companies: JSON
  customers: JSON
  assignedUsers: JSON
  stage: JSON
  labels: JSON
  isComplete: Boolean
  isWatched: Boolean
  relations: JSON
  startDate: Date
  closeDate: Date
  createdAt: Date
  modifiedAt: Date
  priority: String
  hasNotified: Boolean
  score: Float
  number: String
  stageChangedDate: Date
  tagIds: [String]
  customProperties: JSON
  type: String
  status: String
  branchIds: [String]
  branches:[Branch]
  departmentIds: [String]
  departments:[Department]
  assignedUserIds: [String]
  order: Int,
  createdUserId:String
  tags: [Tag]
`;
