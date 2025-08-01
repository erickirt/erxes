import { isEnabled } from '@erxes/api-utils/src/serviceDiscovery';
import { IContext } from '../../../connectionResolver';
import { sendCoreMessage } from '../../../messageBroker';
import { IItemCommonFields } from '../../../models/definitions/boards';
import { IDealDocument } from '../../../models/definitions/deals';

export default {
  async branches(item: IItemCommonFields, args, { subdomain }: IContext) {
    return sendCoreMessage({
      subdomain,
      action: 'branches.find',
      data: {
        query: { _id: { $in: item.branchIds } },
      },
      isRPC: true,
      defaultValue: [],
    });
  },
  async departments(item: IItemCommonFields, args, { subdomain }: IContext) {
    return sendCoreMessage({
      subdomain,
      action: 'departments.find',
      data: {
        _id: { $in: item.departmentIds },
      },
      isRPC: true,
      defaultValue: [],
    });
  },
  async customPropertiesData(
    item: IItemCommonFields,
    _args,
    { user, subdomain },
  ) {
    const customFieldsData = (item?.customFieldsData as any[]) || [];

    const fieldIds = customFieldsData.map(customField => customField.field);

    if (!fieldIds?.length) {
      return customFieldsData;
    }

    const fields = await sendCoreMessage({
      subdomain,
      action: 'fields.find',
      data: {
        query: { _id: { $in: fieldIds } },
      },
      isRPC: true,
      defaultValue: [],
    });

    for (const customFieldData of customFieldsData) {
      const field = fields.find(field => field._id === customFieldData.field);
      if (field) {
        customFieldData.type = field.type;
      }
    }

    return customFieldsData;
  },
  createdUserId(item: { _id: string } & IItemCommonFields) {
    return item?.userId ? item.userId : null;
  },
  async tags(deal: IDealDocument) {
    return (deal.tagIds || [])
      .filter(_id => !!_id)
      .map(_id => ({ __typename: 'Tag', _id }));
  },
  async loyalty(deal: IDealDocument) {
    if (!deal?.extraData || !isEnabled("loyalties")) {
      return;
    }

    const result: any = [];

    const { voucherId, couponCode } = deal.extraData;

    if (voucherId) {
      result.push({ __typename: "Voucher", _id: voucherId });
    }

    if (couponCode) {
      result.push({ __typename: "Coupon", _id: couponCode });
    }

    return result;
  },
};
