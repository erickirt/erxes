import * as mongoose from 'mongoose';
import { IEbarimtDocument } from './models/definitions/ebarimt';
import { IPutResponseModel, loadPutResponseClass } from './models/Ebarimt';
import { IContext as IMainContext } from '@erxes/api-utils/src';
import { createGenerateModels } from '@erxes/api-utils/src/core';
import { IProductRuleDocument } from './models/definitions/productRule';
import { IProductRuleModel, loadProductRuleClass } from './models/ProductRule';
import { IProductGroupModel, loadProductGroupClass } from './models/ProductGroup';
import { IProductGroupDocument } from './models/definitions/productGroup';

export interface IModels {
  PutResponses: IPutResponseModel;
  ProductRules: IProductRuleModel;
  ProductGroups: IProductGroupModel;
}
export interface IContext extends IMainContext {
  subdomain: string;
  models: IModels;
}

export const loadClasses = (db: mongoose.Connection): IModels => {
  const models = {} as IModels;

  models.PutResponses = db.model<IEbarimtDocument, IPutResponseModel>(
    'putresponses',
    loadPutResponseClass(models),
  );

  models.ProductRules = db.model<IProductRuleDocument, IProductRuleModel>(
    'ebarimt_product_rules',
    loadProductRuleClass(models),
  );

  models.ProductGroups = db.model<IProductGroupDocument, IProductGroupModel>(
    'ebarimt_product_groups',
    loadProductGroupClass(models),
  );

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);
