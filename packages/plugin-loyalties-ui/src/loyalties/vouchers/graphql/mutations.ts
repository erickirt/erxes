import { commonDefs, commonVariables } from '../../common/graphq';
import { voucherFields } from './queries';

const vouchersAdd = `
  mutation vouchersAdd(${commonDefs}, $status: String) {
    vouchersAdd(${commonVariables}, status: $status) {
      ${voucherFields}
    }
  }
`;

const vouchersAddMany = `
  mutation vouchersAddMany(${commonDefs}, $status: String) {
    vouchersAddMany(${commonVariables}, status: $status)
  }
`;

const vouchersEdit = `
  mutation vouchersEdit($_id: String!, ${commonDefs}, $status: String) {
    vouchersEdit(_id: $_id, ${commonVariables}, status: $status) {
      ${voucherFields}
    }
  }
`;

const vouchersRemove = `
  mutation vouchersRemove($_ids: [String]) {
    vouchersRemove(_ids: $_ids)
  }
`;

export default {
  vouchersAdd,
  vouchersAddMany,
  vouchersEdit,
  vouchersRemove
};
