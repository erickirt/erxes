const customersAdd = `
  mutation CallAddCustomer($inboxIntegrationId: String, $primaryPhone: String, $queueName: String) {
    callAddCustomer(inboxIntegrationId: $inboxIntegrationId, primaryPhone: $primaryPhone, queueName: $queueName) {
      channels {
        _id
        name
      }
      customer {
        _id
        avatar
        code
        createdAt
        getTags {
          _id
          name
          type
          colorCode
          createdAt
          objectCount
          totalObjectCount
          parentId
          order
          relatedIds
        }
        email
        primaryPhone
        tagIds
        lastName
        firstName
      }
  }
}
`;

const messageFields = `
  _id
  content
  mentionedUserIds
  conversationId

  internal
  contentType
  customerId
  userId
  createdAt
  isCustomerRead
 
  customer {
    _id
    avatar
    firstName
    primaryPhone

    tagIds
    getTags {
        _id
        name
        colorCode
      }
    }
  }
`;

const conversationMessageAdd = `
  mutation conversationMessageAdd(
    $conversationId: String,
    $content: String,
    $contentType: String,
    $mentionedUserIds: [String],
    $internal: Boolean,
    $attachments: [AttachmentInput],
    $extraInfo: JSON
  ) {
    conversationMessageAdd(
      conversationId: $conversationId,
      content: $content,
      contentType: $contentType,
      mentionedUserIds: $mentionedUserIds,
      internal: $internal,
      attachments: $attachments,
      extraInfo: $extraInfo
    ) {
      ${messageFields}
    }
  }
`;

const addActiveSession = `
  mutation CallUpdateActiveSession {
    callUpdateActiveSession
  }
`;

const callTerminateSession = `
  mutation callTerminateSession {
    callTerminateSession
  }
`;

const callDisconnect = `
  mutation callDisconnect {
    callDisconnect
  }
`;

const callHistoryAdd = `
  mutation CallHistoryAdd($inboxIntegrationId: String,$customerPhone: String, $callStartTime: Date ,$callStatus: String, $callType: String, $timeStamp: Float, $endedBy: String, $queueName: String) {
  callHistoryAdd(inboxIntegrationId: $inboxIntegrationId,  customerPhone: $customerPhone, callStartTime: $callStartTime, callStatus: $callStatus, callType: $callType, timeStamp: $timeStamp, endedBy: $endedBy, queueName: $queueName) {
    _id
    timeStamp
    conversationId
  }
}
`;

const callHistoryEdit = `
  mutation CallHistoryEdit($id: String, $inboxIntegrationId: String, $customerPhone: String, $callDuration: Int, $callStartTime: Date, $callEndTime: Date, $callType: String, $callStatus: String, $timeStamp: Float, $transferredCallStatus: String, $endedBy: String) {
    callHistoryEdit(_id: $id, inboxIntegrationId: $inboxIntegrationId, customerPhone: $customerPhone, callDuration: $callDuration, callStartTime: $callStartTime, callEndTime: $callEndTime, callType: $callType, callStatus: $callStatus, timeStamp: $timeStamp, transferredCallStatus: $transferredCallStatus, endedBy: $endedBy) 
}`;

const callHistoryEditStatus = ` 
  mutation CallHistoryEditStatus($callStatus: String, $timeStamp: Float) {
    callHistoryEditStatus(callStatus: $callStatus, timeStamp: $timeStamp)
}`;

const callHistoryRemove = ` 
  mutation CallHistoryRemove($id: String!) {
    callHistoryRemove(_id: $id)
}`;

const callsUpdateConfigs = `
  mutation callsUpdateConfigs($configsMap: JSON!) {
    callsUpdateConfigs(configsMap: $configsMap)
  }
`;
const callPauseAgent = `
  mutation callsPauseAgent($status: String!, $integrationId: String!) {
    callsPauseAgent(status: $status, integrationId: $integrationId)
}`;

const callTransfer = `
  mutation callTransfer($extensionNumber: String!, $integrationId: String!, $direction: String) {
    callTransfer(extensionNumber: $extensionNumber, integrationId: $integrationId, direction: $direction)
}`;

const callSelectCustomer = `
  mutation callSelectCustomer($integrationId: String!, $customerId: String!, $phoneNumber: String!, $conversationId: String!) {
    callSelectCustomer(integrationId: $integrationId, customerId: $customerId, phoneNumber: $phoneNumber, conversationId: $conversationId){
      firstName
      lastName
      primaryPhone
      phones
      _id
    }
}`;

export default {
  customersAdd,
  conversationMessageAdd,
  addActiveSession,
  callTerminateSession,
  callDisconnect,
  callHistoryEdit,
  callHistoryAdd,
  callHistoryRemove,
  callsUpdateConfigs,
  callHistoryEditStatus,
  callPauseAgent,
  callTransfer,
  callSelectCustomer,
};
