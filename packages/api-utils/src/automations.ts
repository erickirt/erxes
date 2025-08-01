import * as moment from 'moment';
import { pluralFormation } from './commonUtils';

export const replacePlaceHolders = async ({
  models,
  subdomain,
  actionData,
  target,
  isRelated = true,
  getRelatedValue,
  relatedValueProps,
  complexFields
}: {
  models;
  subdomain: string;
  actionData?: any;
  target: any;
  isRelated?: boolean;
  getRelatedValue: any;
  relatedValueProps?: any;
  complexFields?: string[];
}) => {
  if (actionData) {
    const targetKeys = Object.keys(target);
    const actionDataKeys = Object.keys(actionData);

    for (const actionDataKey of actionDataKeys) {
      const regex = /{{\s*([\w\d]+(?:\.[\w\d\-]+)*)\s*}}/g;
      const fieldKeys = [...actionData[actionDataKey].matchAll(regex)].map(
        (match) => match[1]
      );

      for (const fieldKey of fieldKeys) {
        const targetKey = targetKeys.find(
          (targetKey) => targetKey === fieldKey
        );
        if (targetKey) {
          if (actionData[actionDataKey].includes(`{{ ${targetKey} }}`)) {
            const replaceValue =
              (isRelated &&
                (await getRelatedValue(
                  models,
                  subdomain,
                  target,
                  targetKey,
                  relatedValueProps
                ))) ||
              target[targetKey];

            actionData[actionDataKey] = actionData[actionDataKey].replace(
              `{{ ${targetKey} }}`,
              replaceValue
            );
          }

          // some text {{now+3d }} some text
          const nowRegex = new RegExp(/{{ now\+(\d+)d }}/g);
          const regexResult = nowRegex.exec(actionData[actionDataKey]);

          if (regexResult && regexResult.length === 2) {
            const dayValue = regexResult[1];
            actionData[actionDataKey] = moment()
              .add(dayValue, 'day')
              .toDate()
              .toString();
          }

          if (actionData[actionDataKey].includes(`{{ now }}`)) {
            actionData[actionDataKey] = actionData[actionDataKey].replace(
              `{{ now }}`,
              new Date()
            );
          }

          if (actionData[actionDataKey].includes(`{{ tomorrow }}`)) {
            const today = new Date();
            const tomorrow = today.setDate(today.getDate() + 1);
            actionData[actionDataKey] = actionData[actionDataKey].replace(
              `{{ tomorrow }}`,
              tomorrow
            );
          }
          if (actionData[actionDataKey].includes(`{{ nextWeek }}`)) {
            const today = new Date();
            const nextWeek = today.setDate(today.getDate() + 7);
            actionData[actionDataKey] = actionData[actionDataKey].replace(
              `{{ nextWeek }}`,
              nextWeek
            );
          }
          if (actionData[actionDataKey].includes(`{{ nextMonth }}`)) {
            const today = new Date();
            const nextMonth = today.setDate(today.getDate() + 30);
            actionData[actionDataKey] = actionData[actionDataKey].replace(
              `{{ nextMonth }}`,
              nextMonth
            );
          }
        } else {
          for (const complexFieldKey of [
            'customFieldsData',
            'trackedData'
          ].concat(complexFields || [])) {
            if (fieldKey.includes(`${complexFieldKey}.`)) {
              const [_, fieldId] = fieldKey.split('.');

              const complexFieldData = target[complexFieldKey].find(
                (cfd) => cfd.field === fieldId
              );

              const replaceValue =
                (await getRelatedValue(
                  models,
                  subdomain,
                  target,
                  `${complexFieldKey}.${fieldId}`,
                  relatedValueProps
                )) ||
                complexFieldData?.value ||
                '-';

              actionData[actionDataKey] = actionData[actionDataKey].replace(
                `{{ ${complexFieldKey}.${fieldId} }}`,
                replaceValue
              );
            }
          }
        }
      }

      actionData[actionDataKey] = actionData[actionDataKey]
        .replace(/\[\[ /g, '')
        .replace(/ \]\]/g, '');
    }
  }

  return actionData;
};

export const OPERATORS = {
  SET: 'set',
  CONCAT: 'concat',
  ADD: 'add',
  SUBTRACT: 'subtract',
  MULTIPLY: 'multiply',
  DIVIDE: 'divide',
  PERCENT: 'percent',
  ALL: ['set', 'concat', 'add', 'subtract', 'multiply', 'divide', 'percent']
};

const convertOp1 = (relatedItem, field) => {
  if (
    ['customFieldsData', 'trackedData'].some((complexField) =>
      field.includes(complexField)
    )
  ) {
    const [complexFieldKey, nestedComplexFieldKey] = field.split('.');
    return (relatedItem[complexFieldKey] || []).find(
      (nestedObj) => nestedObj.field === nestedComplexFieldKey
    )?.value;
  }

  return relatedItem[field];
};

const getPerValue = async (args: {
  models;
  subdomain: string;
  relatedItem: any;
  rule;
  target;
  getRelatedValue;
  triggerType?;
  serviceName?;
  sendCommonMessage;
  execution;
}) => {
  const {
    models,
    subdomain,
    relatedItem,
    rule,
    target,
    getRelatedValue,
    serviceName,
    triggerType,
    sendCommonMessage,
    execution
  } = args;
  let { field, operator, value } = rule;

  const op1Type = typeof convertOp1(relatedItem, field);

  // replace placeholder if value has attributes from related service
  if (
    value.match(/\{\{\s*([^}]+)\s*\}\}/g) &&
    !(triggerType || '').includes(serviceName)
  ) {
    const [relatedServiceName] = triggerType.split(':');

    value =
      (
        await sendCommonMessage({
          serviceName: relatedServiceName,
          subdomain,
          action: 'automations.replacePlaceHolders',
          data: {
            execution,
            target,
            config: { value }
          },
          isRPC: true,
          defaultValue: {}
        })
      )?.value || value;
  }

  let op1 = convertOp1(relatedItem, field);

  let updatedValue = (
    await replacePlaceHolders({
      models,
      subdomain,
      getRelatedValue,
      actionData: { config: value },
      target,
      isRelated: op1Type === 'string' ? true : false
    })
  ).config;

  if (updatedValue.match(/^[0-9+\-*/\s().]+$/)) {
    updatedValue = eval(updatedValue.replace(/{{.*}}/, '0'));
  }

  if (field.includes('Ids')) {
    const ids: string[] =
      (updatedValue || '').trim().replace(/, /g, ',').split(',') || [];
    updatedValue = Array.from(new Set(ids));
  }

  if (
    [
      OPERATORS.ADD,
      OPERATORS.SUBTRACT,
      OPERATORS.MULTIPLY,
      OPERATORS.DIVIDE,
      OPERATORS.PERCENT
    ].includes(operator)
  ) {
    op1 = op1 || 0;
    const numberValue = parseInt(value, 10);

    switch (operator) {
      case OPERATORS.ADD:
        updatedValue = op1 + numberValue;
        break;
      case OPERATORS.SUBTRACT:
        updatedValue = op1 - numberValue;
        break;
      case OPERATORS.MULTIPLY:
        updatedValue = op1 * numberValue;
        break;
      case OPERATORS.DIVIDE:
        updatedValue = op1 / numberValue || 1;
        break;
      case OPERATORS.PERCENT:
        updatedValue = (op1 / 100) * numberValue;
        break;
    }
  }

  if (operator === 'concat') {
    updatedValue = (op1 || '').concat(updatedValue);
  }

  if (['addDay', 'subtractDay'].includes(operator)) {
    op1 = op1 || new Date();

    try {
      op1 = new Date(op1);
    } catch (e) {
      op1 = new Date();
    }

    updatedValue =
      operator === 'addDay'
        ? parseFloat(updatedValue)
        : -1 * parseFloat(updatedValue);
    updatedValue = new Date(op1.setDate(op1.getDate() + updatedValue));
  }

  return updatedValue;
};

export const setProperty = async ({
  models,
  subdomain,
  module,
  rules,
  execution,
  getRelatedValue,
  relatedItems,
  sendCommonMessage,
  triggerType
}: {
  models;
  subdomain;
  module;
  rules;
  execution;
  getRelatedValue;
  relatedItems;
  sendCommonMessage;
  triggerType?;
}) => {
  const { target } = execution;
  const [serviceName, collectionType] = module.split(':');

  const result: any[] = [];

  for (const relatedItem of relatedItems) {
    const setDoc = {};
    const pushDoc = {};
    const selectorDoc = {};
    const servicesToForward: string[] = [];

    for (const rule of rules) {
      const value = await getPerValue({
        models,
        subdomain,
        relatedItem,
        rule,
        target,
        getRelatedValue,
        triggerType,
        serviceName,
        sendCommonMessage,
        execution
      });

      if (rule.forwardTo) {
        servicesToForward.push(rule.forwardTo);
      }

      if (
        !rule.field.includes('customFieldsData') &&
        !rule.field.includes('trackedData')
      ) {
        setDoc[rule.field] = value;
        continue;
      }

      for (const complexFieldKey of ['customFieldsData', 'trackedData']) {
        if (rule.field.includes(complexFieldKey)) {
          const fieldId = rule.field.replace(`${complexFieldKey}.`, '');

          const field = await sendCommonMessage({
            subdomain,
            serviceName: 'core',
            action: 'fields.findOne',
            data: {
              query: { _id: fieldId }
            },
            isRPC: true,
            defaultValue: {}
          });

          const complexFieldData = await sendCommonMessage({
            subdomain,
            serviceName: 'core',
            action: 'fields.generateTypedItem',
            data: {
              field: fieldId,
              value,
              type: field?.type
            },
            isRPC: true
          });

          if (
            (relatedItem[complexFieldKey] || []).find(
              (obj) => obj.field === fieldId
            )
          ) {
            selectorDoc[`${complexFieldKey}.field`] = fieldId;

            const complexFieldDataKeys = Object.keys(complexFieldData).filter(
              (key) => key !== 'field'
            );

            for (const complexFieldDataKey of complexFieldDataKeys) {
              setDoc[`${complexFieldKey}.$.${complexFieldDataKey}`] =
                complexFieldData[complexFieldDataKey];
            }
          } else {
            pushDoc[complexFieldKey] = complexFieldData;
          }
        }
      }
    }

    const modifier: any = {};

    if (Object.keys(setDoc).length > 0) {
      modifier.$set = setDoc;
    }

    if (Object.keys(pushDoc).length > 0) {
      modifier.$push = pushDoc;
    }

    const response = await sendCommonMessage({
      subdomain,
      serviceName,
      action: `${pluralFormation(collectionType)}.updateMany`,
      data: { selector: { _id: relatedItem._id, ...selectorDoc }, modifier },
      isRPC: true
    });

    for (const service of servicesToForward) {
      await sendCommonMessage({
        subdomain,
        serviceName: service,
        action: 'automations.receiveSetPropertyForwardTo',
        data: {
          target,
          collectionType,
          setDoc,
          pushDoc
        }
      });
    }

    if (response.error) {
      result.push(response);
      continue;
    }

    result.push({
      _id: relatedItem._id,
      rules: (Object as any)
        .values(setDoc)
        .map((v) => String(v))
        .join(', ')
    });
  }

  return { module, fields: rules.map((r) => r.field).join(', '), result };
};
