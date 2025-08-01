import { IContext } from "../../../connectionResolver";
import {
  sendCommonMessage,
  sendCoreMessage,
  sendNotificationsMessage,
} from "../../../messageBroker";
import { ITicketDocument } from "../../../models/definitions/tickets";
import { boardId } from "../../utils";

export default {
  async __resolveReference({ _id }, { models }: IContext) {
    return models.Tickets.findOne({ _id });
  },

  async companies(
    ticket: ITicketDocument,
    _args,
    { subdomain }: IContext,
    { isSubscription }
  ) {
    const companyIds = await sendCoreMessage({
      subdomain,
      action: "conformities.savedConformity",
      data: {
        mainType: "ticket",
        mainTypeId: ticket._id,
        relTypes: ["company"],
      },
      isRPC: true,
      defaultValue: [],
    });

    const companies = await sendCoreMessage({
      subdomain,
      action: "companies.findActiveCompanies",
      data: { selector: { _id: { $in: companyIds } } },
      isRPC: true,
      defaultValue: [],
    });

    if (isSubscription) {
      return companies;
    }

    return (companies || []).map(({ _id }) => ({ __typename: "Company", _id }));
  },

  async customers(
    ticket: ITicketDocument,
    _args,
    { subdomain }: IContext,
    { isSubscription }
  ) {
    const customerIds = await sendCoreMessage({
      subdomain,
      action: "conformities.savedConformity",
      data: {
        mainType: "ticket",
        mainTypeId: ticket._id,
        relTypes: ["customer"],
      },
      isRPC: true,
      defaultValue: [],
    });

    const customers = await sendCoreMessage({
      subdomain,
      action: "customers.findActiveCustomers",
      data: {
        selector: {
          _id: { $in: customerIds },
        },
      },
      isRPC: true,
      defaultValue: [],
    });

    if (isSubscription) {
      return customers;
    }

    return (customers || []).map(({ _id }) => ({
      __typename: "Customer",
      _id,
    }));
  },

  async assignedUsers(
    ticket: ITicketDocument,
    _args,
    { subdomain }: IContext,
    { isSubscription }
  ) {
    if (isSubscription && ticket.assignedUserIds?.length) {
      return sendCoreMessage({
        subdomain,
        action: "users.find",
        data: {
          query: {
            _id: { $in: ticket.assignedUserIds },
          },
        },
        isRPC: true,
      });
    }

    return (ticket.assignedUserIds || [])
      .filter((e) => e)
      .map((_id) => ({
        __typename: "User",
        _id,
      }));
  },

  async pipeline(
    ticket: ITicketDocument,
    _args,
    { models: { Stages, Pipelines } }: IContext
  ) {
    const stage = await Stages.getStage(ticket.stageId);

    return Pipelines.findOne({ _id: stage.pipelineId });
  },

  async boardId(ticket: ITicketDocument, _args, { models }: IContext) {
    return boardId(models, ticket);
  },

  async stage(
    ticket: ITicketDocument,
    _args,
    { models: { Stages } }: IContext
  ) {
    return Stages.getStage(ticket.stageId);
  },

  async isWatched(ticket: ITicketDocument, _args, { user }: IContext) {
    const watchedUserIds = ticket.watchedUserIds || [];

    if (watchedUserIds.includes(user._id)) {
      return true;
    }

    return false;
  },

  async hasNotified(
    ticket: ITicketDocument,
    _args,
    { user, subdomain }: IContext
  ) {
    return sendNotificationsMessage({
      subdomain,
      action: "checkIfRead",
      data: {
        userId: user._id,
        itemId: ticket._id,
      },
      isRPC: true,
      defaultValue: true,
    });
  },

  async labels(
    ticket: ITicketDocument,
    _args,
    { models: { PipelineLabels } }: IContext
  ) {
    return PipelineLabels.find({ _id: { $in: ticket.labelIds || [] } });
  },

  async tags(ticket: ITicketDocument) {
    return (ticket.tagIds || [])
      .filter((_id) => !!_id)
      .map((_id) => ({ __typename: "Tag", _id }));
  },

  createdUser(ticket: ITicketDocument) {
    if (!ticket.userId) {
      return;
    }

    return { __typename: "User", _id: ticket.userId };
  },

  async vendorCustomers(
    ticket: ITicketDocument,
    _args,
    { subdomain }: IContext
  ) {
    return sendCommonMessage({
      subdomain,
      serviceName: "clientportal",
      action: "clientPortalUserCards.users",
      data: {
        contentType: "ticket",
        contentTypeId: ticket.id,
      },
      isRPC: true,
    });
  },
};
