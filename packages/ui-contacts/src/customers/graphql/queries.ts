import {
  conformityQueryFieldDefs,
  conformityQueryFields,
} from "@erxes/ui-sales/src/conformity/graphql/queries";

import { isEnabled } from "@erxes/ui/src/utils/core";

const basicFields = `
  _id
  firstName
  middleName
  lastName
  avatar
  sex
  birthDate
  primaryEmail
  emails
  primaryPhone
  phones

  state
  visitorContactInfo

  modifiedAt

  position
  department
  leadStatus
  hasAuthority
  description
  isSubscribed
  code
  emailValidationStatus
  registrationNumber
  phoneValidationStatus
  score

  isOnline
  lastSeenAt
  sessionCount

  links
  ownerId
  owner {
    _id
    details {
      fullName
    }
  }
`;

export const customerFields = `
  ${basicFields}
  integrationId
  createdAt
  remoteAddress
  location

  customFieldsData
  trackedData
  tagIds
  getTags {
    _id
    name
    colorCode
  }

`;

const listParamsDef = `
  $page: Int,
  $perPage: Int,
  $segment: String,
  $tag: String,
  $type: String,
  $ids: [String],
  $excludeIds: Boolean,
  $searchValue: String,
  $autoCompletionType: String,
  $autoCompletion: Boolean,
  $brand: String,
  $integration: String,
  $form: String,
  $startDate: String,
  $endDate: String,
  $leadStatus: String,
  $sortField: String,
  $sortDirection: Int,
  $dateFilters: String,
  $segmentData: String
  $emailValidationStatus:String,
  $registrationNumber: String,
  ${conformityQueryFields}
`;

const listParamsValue = `
  page: $page,
  perPage: $perPage,
  segment: $segment,
  tag: $tag,
  type: $type,
  ids: $ids,
  excludeIds: $excludeIds,
  autoCompletionType: $autoCompletionType,
  autoCompletion: $autoCompletion,
  searchValue: $searchValue,
  brand: $brand,
  integration: $integration
  form: $form,
  startDate: $startDate,
  endDate: $endDate,
  leadStatus: $leadStatus,
  sortField: $sortField,
  sortDirection: $sortDirection,
  dateFilters: $dateFilters,
  segmentData: $segmentData,
  emailValidationStatus:$emailValidationStatus,
  registrationNumber: $registrationNumber,
  ${conformityQueryFieldDefs}
`;

const customers = `
  query customers(${listParamsDef}) {
    customers(${listParamsValue}) {
      ${customerFields}
    }
  }
`;

const customersMain = `
  query customersMain(${listParamsDef}) {
    customersMain(${listParamsValue}) {
      list {
        ${customerFields}
      }

      totalCount
    }
  }
`;

const customersExport = `
  query customersExport(${listParamsDef}) {
    customersExport(${listParamsValue})
  }
`;

const customerCounts = `
  query customerCounts(${listParamsDef}, $only: String) {
    customerCounts(${listParamsValue}, only: $only)
  }
`;

const customerDetail = `
  query customerDetail($_id: String!) {
    customerDetail(_id: $_id) {
      ${customerFields}
      urlVisits
      ${
        isEnabled("inbox")
          ? `
        integration {
          kind
          name
          isActive
        }
      `
          : ``
      }
      companies {
        _id
        primaryName
        website
      }
    }
  }
`;

const customersListConfig = `
  query {
    fieldsDefaultColumnsConfig(contentType: "core:customer") {
      name
      label
      order
    }
  }
`;

const integrationsGetUsedTypes = `
  query integrationsGetUsedTypes {
    integrationsGetUsedTypes {
      _id
      name
    }
  }
`;

export default {
  basicFields,
  customers,
  customersMain,
  customerCounts,
  customerDetail,
  customersListConfig,
  customersExport,
  integrationsGetUsedTypes,
};
