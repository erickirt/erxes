import {
  Button,
  ControlLabel,
  FormGroup,
  Icon,
} from "@erxes/ui/src/components";
import {
  COMPANY_BUSINESS_TYPES,
  COMPANY_INDUSTRY_TYPES,
  COUNTRIES,
} from "@erxes/ui-contacts/src/companies/constants";
import { IAttachment, IField, ILocationOption } from "@erxes/ui/src/types";
import { LogicIndicator, SelectInput } from "../styles";
import { RenderDynamicComponent, __ } from "@erxes/ui/src/utils/core";
import Select, { OnChangeValue } from "react-select";

import Datetime from "@nateradebaugh/react-datetime";
import ErrorBoundary from "@erxes/ui/src/components/ErrorBoundary";
import FormControl from "@erxes/ui/src/components/form/Control";
import { IOption } from "@erxes/ui/src/types";
import Map from "@erxes/ui/src/containers/map/Map";
import ModifiableList from "@erxes/ui/src/components/ModifiableList";
import ObjectList from "./ObjectList";
import React from "react";
import SelectBranches from "@erxes/ui/src/team/containers/SelectBranches";
import SelectCustomers from "@erxes/ui-contacts/src/customers/containers/SelectCustomers";
import SelectDepartments from "@erxes/ui/src/team/containers/SelectDepartments";
import SelectProductCategory from "../containers/SelectProductCategory";
import SelectProducts from "@erxes/ui-products/src/containers/SelectProducts";
import { SelectTeamMembers } from "@erxes/ui/src";
import Uploader from "@erxes/ui/src/components/Uploader";

type Props = {
  field: IField;
  otherFields?: IField[];
  currentLocation?: ILocationOption;
  defaultValue?: any;
  hasLogic?: boolean;
  isEditing?: boolean;
  isPreview?: boolean;
  onValueChange?: (data: {
    _id: string;
    name?: string;
    value: any;
    extraValue?: string;
  }) => void;
  onChangeLocationOptions?: (locationOptions: ILocationOption[]) => void;
};

type State = {
  value?: any;
  checkBoxValues: any[];
  isCheckUserTicket?: boolean;
  errorCounter: number;
  currentLocation?: ILocationOption;
  errorMessage?: string;
};

export default class GenerateField extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      errorCounter: 0,
      ...this.generateState(props),
      currentLocation: props.currentLocation,
    };
  }

  generateState = (props) => {
    const { field, defaultValue } = props;

    const state = {
      value: defaultValue,
      checkBoxValues: [],
      isCheckUserTicket: false,
    };

    if (defaultValue && field.type === "check") {
      state.checkBoxValues = defaultValue;
    } else if (field.type === "isCheckUserTicket") {
      state.isCheckUserTicket =
        typeof defaultValue === "boolean" ? defaultValue : false;
    }

    return state;
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.defaultValue !== this.props.defaultValue) {
      this.setState(this.generateState(nextProps));
    }

    if (nextProps.currentLocation !== this.props.currentLocation) {
      this.setState({
        currentLocation: nextProps.currentLocation,
      });
    }
  }

  renderSelect(options: string[] = [], attrs = {}) {
    return (
      <FormControl componentclass="select" {...attrs}>
        <option key={""} value="">
          Choose option
        </option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </FormControl>
    );
  }

  renderLabelSelect(
    options: { key: string; label: string }[] = [],
    attrs = {}
  ) {
    return (
      <FormControl componentclass="select" {...attrs}>
        <option key={""} value="">
          Choose option
        </option>
        {options.map((option, index) => (
          <option key={index} value={option.key}>
            {option.label}
          </option>
        ))}
      </FormControl>
    );
  }

  renderMultiSelect(options: string[] = [], attrs) {
    const onChange = (ops: OnChangeValue<IOption, true>) => {
      const { field, onValueChange } = this.props;

      if (onValueChange) {
        const value = ops.map((e) => e.value).toString();
        this.setState({ value });

        onValueChange({ _id: field._id, value });
      }
    };

    const selectOptions = options.map((e) => ({ value: e, label: e }));

    return (
      <Select
        value={selectOptions.filter((option) =>
          (attrs.value || []).includes(option.value)
        )}
        options={selectOptions}
        onChange={onChange}
        isMulti={true}
      />
    );
  }

  renderInput(attrs, hasError?: boolean) {
    let { value, errorCounter, errorMessage } = this.state;
    let checkBoxValues = this.state.checkBoxValues || [];
    const { type } = this.props.field;
    let { validation, isDisabled } = this.props.field;

    if (hasError) {
      value = "";
      checkBoxValues = [];
      this.setState({ value, checkBoxValues });
    }

    attrs.type = "text";
    const errorObject: any = {};

    // attrs.errors =

    if (errorMessage) {
      errorObject[attrs.name] = errorMessage;
      attrs.errors = errorObject;
    }

    attrs.onChange = (e) => {
      this.setState({ value: e.target.value });
      this.onChange(e, attrs.option);
    };

    if (type === "radio") {
      attrs.type = "radio";
      attrs.componentclass = "radio";
      attrs.checked = String(value) === attrs.option;
    }

    if (type === "hasAuthority") {
      attrs.type = "radio";
      attrs.componentclass = "radio";
      attrs.checked = String(value) === attrs.option;
    }

    if (type && type.includes("isSubscribed")) {
      attrs.type = "radio";
      attrs.componentclass = "radio";
      attrs.checked = String(value) === attrs.option;
    }

    if (type === "check") {
      attrs.type = "checkbox";
      attrs.componentclass = "checkbox";
      attrs.checked = checkBoxValues.includes(attrs.option);
    }

    if (type === "birthDate") {
      validation = "date";
    }

    if (validation === "datetime") {
      attrs.max = "9999-12-31";

      // redefine onChange since date chooser returns the value, not event
      attrs.onChange = (val) => {
        this.setState({ value: val });
        this.onChange(val, val);
      };

      return (
        <Datetime
          {...attrs}
          value={value}
          dateFormat="YYYY/MM/DD"
          timeFormat="HH:mm"
          closeOnSelect={true}
        />
      );
    }

    if (validation === "date") {
      attrs.max = "9999-12-31";

      // redefine onChange since date chooser returns the value, not event
      attrs.onChange = (val) => {
        this.setState({ value: val });
        this.onChange(val, val);
      };

      return (
        <div className="dateTime">
          <Datetime
            {...attrs}
            value={value}
            dateFormat="YYYY/MM/DD"
            timeFormat={false}
            closeOnSelect={true}
          />
        </div>
      );
    }

    if (validation === "number") {
      attrs.type = "number";
    }

    if (hasError && errorCounter < 10) {
      errorCounter = errorCounter + 1;

      this.setState({ errorCounter });
    }

    if (isDisabled) {
      attrs.disabled = true;
    }

    return <FormControl {...attrs} />;
  }

  renderTextarea(attrs) {
    return <FormControl componentclass="textarea" {...attrs} />;
  }

  renderRadioOrCheckInputs(options, attrs, hasError?: boolean) {
    return (
      <div>
        {options.map((option, index) => (
          <SelectInput key={index}>
            {this.renderInput({ ...attrs, option }, hasError)}
            <span>{option}</span>
          </SelectInput>
        ))}
      </div>
    );
  }

  renderFile({ id, value }) {
    const onChangeFile = (attachments: IAttachment[]) => {
      const { onValueChange } = this.props;

      if (onValueChange) {
        this.setState({ value: attachments });

        onValueChange({ _id: id, value: attachments });
      }
    };

    let defaultFileList = value || [];

    if (!Array.isArray(value)) {
      defaultFileList = [value];
    }

    return (
      <Uploader
        defaultFileList={defaultFileList}
        onChange={onChangeFile}
        multiple={true}
        single={false}
      />
    );
  }

  renderCustomer({ id, value }) {
    const onSelect = (e) => {
      const { onValueChange } = this.props;

      if (onValueChange) {
        this.setState({ value: e });

        onValueChange({ _id: id, value: e });
      }
    };

    return (
      <SelectCustomers
        label="Filter by customers"
        name="customerIds"
        multi={false}
        initialValue={value}
        onSelect={onSelect}
      />
    );
  }

  renderUser({ id, value }) {
    const onSelect = (e) => {
      const { onValueChange } = this.props;

      if (onValueChange) {
        this.setState({ value: e });

        onValueChange({ _id: id, value: e });
      }
    };

    return (
      <SelectTeamMembers
        label="Choose team members"
        name="userIds"
        multi={true}
        initialValue={value}
        onSelect={onSelect}
      />
    );
  }

  renderProduct({ id, value }) {
    const onSelect = (e) => {
      const { onValueChange } = this.props;

      if (onValueChange) {
        this.setState({ value: e });

        onValueChange({ _id: id, value: e });
      }
    };

    return (
      <SelectProducts
        label="Filter by products"
        name="productIds"
        multi={false}
        initialValue={value}
        onSelect={onSelect}
      />
    );
  }

  renderBranch({ id, value }) {
    const onSelect = (e) => {
      const { onValueChange } = this.props;

      if (onValueChange) {
        this.setState({ value: e });

        onValueChange({ _id: id, value: e });
      }
    };

    return (
      <SelectBranches
        label="Filter by branches"
        name="branchIds"
        multi={false}
        initialValue={value}
        onSelect={onSelect}
      />
    );
  }

  renderDepartment({ id, value }) {
    const onSelect = (e) => {
      const { onValueChange } = this.props;

      if (onValueChange) {
        this.setState({ value: e });

        onValueChange({ _id: id, value: e });
      }
    };

    return (
      <SelectDepartments
        label="Filter by departments"
        name="departmentIds"
        multi={false}
        initialValue={value}
        onSelect={onSelect}
      />
    );
  }

  renderExtraFields({ id, value }, type, filteredPlugin) {
    const onSelect = (_id, value, extraValue) => {
      const { onValueChange } = this.props;

      if (onValueChange) {
        this.setState({ value: _id });

        onValueChange({ _id: id, value: _id, extraValue });
      }
    };

    const { scope, component } = filteredPlugin.formsExtraFields.find(
      (extraField) => extraField.type === type
    );
    return (
      <ErrorBoundary key={scope}>
        <RenderDynamicComponent
          scope={scope}
          component={component}
          injectedProps={{ value, onSelect }}
        />
      </ErrorBoundary>
    );
  }

  renderHtml() {
    const { content } = this.props.field;
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: content || "",
        }}
      />
    );
  }

  renderList(attrs) {
    let options = [];
    if (attrs.value && attrs.value.length > 0) {
      options = attrs.value.split(",") || [];
    }

    const onChange = (ops) => {
      const { field, onValueChange } = this.props;

      if (onValueChange) {
        const value = ops.toString();

        this.setState({ value });

        onValueChange({ _id: field._id, value });
      }
    };

    return (
      <ModifiableList
        options={options}
        onChangeOption={onChange}
        addButtonLabel={__("Add a value")}
        showAddButton={true}
      />
    );
  }

  renderObjectList(objectListConfigs, attrs) {
    let { value = [] } = attrs;

    if (typeof value === "string" && value.length > 0) {
      try {
        value = JSON.parse(value);
      } catch {
        value = [];
      }
    }

    const { field, onValueChange, isEditing } = this.props;

    if (field.contentType === "form") {
      if (!objectListConfigs) {
        return null;
      }

      return (
        <>
          {objectListConfigs.map((o, index) => (
            <React.Fragment key={index}>
              <p>
                <b>{o.label}</b>
              </p>
              <FormControl
                type="text"
                componentclass={`${o.type}`}
                placeholder={`${o.label}`}
              />
            </React.Fragment>
          ))}
        </>
      );
    }

    const onChange = () => {
      if (onValueChange) {
        this.setState({ value });
        onValueChange({ _id: field._id, value });
      }
    };

    return (
      <ErrorBoundary>
        <ObjectList
          objectListConfigs={objectListConfigs}
          value={value}
          onChange={onChange}
          isEditing={isEditing ? isEditing : false}
        />
      </ErrorBoundary>
    );
  }

  renderMap(attrs) {
    const { field, onValueChange } = this.props;
    const { locationOptions = [] } = field;
    const { value } = attrs;

    let { currentLocation } = this.state;

    const onChangeMarker = (e) => {
      if (onValueChange) {
        onValueChange({ _id: field._id, value: e });
      }
    };

    if (value && value.length !== 0) {
      currentLocation = value;
    }

    return (
      <Map
        id={field._id}
        center={currentLocation || { lat: 0, lng: 0 }}
        locationOptions={locationOptions}
        streetViewControl={false}
        onChangeMarker={onChangeMarker}
      />
    );
  }

  renderIsCheckUserTicket({ id }: { id: string; value: boolean }) {
    const onChange = (e: React.FormEvent<HTMLElement>) => {
      const { onValueChange } = this.props;
      const target = e.target as HTMLInputElement;
      const checked = target.checked;

      this.setState({ isCheckUserTicket: checked });

      if (onValueChange) {
        onValueChange({
          _id: id,
          name: "isCheckUserTicket",
          value: checked,
        });
      }
    };

    return (
      <FormControl
        type="checkbox"
        componentclass="checkbox"
        checked={!!this.state.isCheckUserTicket}
        onChange={onChange}
      />
    );
  }
  renderSelectCategory(attrs) {
    const { field, onValueChange } = this.props;
    const { value } = attrs;

    const onChangeCategory = (values) => {
      if (onValueChange) {
        onValueChange({ _id: field._id, value: values });
      }
    };

    return (
      <SelectProductCategory defaultValue={value} onChange={onChangeCategory} />
    );
  }

  renderParentField() {
    const { field } = this.props;

    if (field.type !== "parentField") {
      return null;
    }

    const otherFields = this.props.otherFields || [];

    const subFields =
      otherFields.filter((otherField) =>
        field.subFieldIds?.includes(otherField._id)
      ) || [];

    return (
      <>
        {subFields.map((subField) => {
          return <GenerateField key={subField._id} field={subField} />;
        })}
      </>
    );
  }

  /**
   * Handle all types of fields changes
   * @param {Object} e - Event object
   * @param {String} optionValue - per radio button or checkbox value
   */
  onChange = (e, optionValue) => {
    const { field, onValueChange } = this.props;
    const { validation, type, regexValidation } = field;

    if (!e.target && !optionValue) {
      return;
    }

    let value = optionValue || e.target.value;

    if (validation === "number") {
      value = Number(value);
    }

    if (type === "check") {
      let checkBoxValues = this.state.checkBoxValues;
      const isChecked = e.target.checked;
      // if selected value is not already in list then add it
      if (isChecked && !checkBoxValues.includes(optionValue)) {
        checkBoxValues.push(optionValue);
      }

      // remove option from checked list
      if (!isChecked) {
        checkBoxValues = checkBoxValues.filter((v) => v !== optionValue);
      }

      this.setState({ checkBoxValues });

      value = checkBoxValues;
    }

    if (validation === "regex" && regexValidation?.length) {
      const regex = new RegExp(regexValidation);

      if (!regex.test(value)) {
        this.setState({ errorMessage: "Invalid value" });
        return;
      }

      this.setState({ errorMessage: undefined });
    }

    if (onValueChange) {
      this.setState({ value });

      onValueChange({ _id: field._id, value });
    }
  };

  renderControl() {
    const { field } = this.props;
    const { type, objectListConfigs } = field;
    const options = field.options || [];

    const attrs = {
      id: field._id,
      value: this.state.value,
      onChange: this.onChange,
      name: "",
    };

    const boolOptions = ["Yes", "No"];

    switch (type) {
      case "select":
        return this.renderSelect(options, attrs);

      case "multiSelect":
        return this.renderMultiSelect(options, attrs);

      case "pronoun":
        return this.renderSelect(["Male", "Female", "Not applicable"], attrs);

      case "check":
        try {
          return this.renderRadioOrCheckInputs(options, attrs);
        } catch {
          return this.renderRadioOrCheckInputs(options, attrs, true);
        }

      case "radio":
        attrs.name = Math.random().toString();
        try {
          return this.renderRadioOrCheckInputs(options, attrs);
        } catch {
          return this.renderRadioOrCheckInputs(options, attrs, true);
        }

      case "hasAuthority":
        attrs.name = Math.random().toString();
        try {
          return this.renderRadioOrCheckInputs(boolOptions, attrs);
        } catch {
          return this.renderRadioOrCheckInputs(boolOptions, attrs, true);
        }

      case "isSubscribed":
        attrs.name = Math.random().toString();
        try {
          return this.renderRadioOrCheckInputs(boolOptions, attrs);
        } catch {
          return this.renderRadioOrCheckInputs(boolOptions, attrs, true);
        }

      case "company_isSubscribed":
        attrs.name = Math.random().toString();
        try {
          return this.renderRadioOrCheckInputs(boolOptions, attrs);
        } catch {
          return this.renderRadioOrCheckInputs(boolOptions, attrs, true);
        }

      case "textarea":
        return this.renderTextarea(attrs);

      case "description":
        return this.renderTextarea(attrs);

      case "company_description":
        return this.renderTextarea(attrs);

      case "file": {
        return this.renderFile(attrs);
      }

      case "avatar": {
        return this.renderFile(attrs);
      }

      case "company_avatar": {
        return this.renderFile(attrs);
      }

      case "industry": {
        return this.renderSelect(COMPANY_INDUSTRY_TYPES(), attrs);
      }

      case "location": {
        return this.renderSelect(COUNTRIES, attrs);
      }

      case "businessType": {
        return this.renderSelect(COMPANY_BUSINESS_TYPES, attrs);
      }

      case "html": {
        return this.renderHtml();
      }

      case "customer": {
        return this.renderCustomer(attrs);
      }

      case "users": {
        return this.renderUser(attrs);
      }

      case "product": {
        return this.renderProduct(attrs);
      }

      case "branch": {
        return this.renderBranch(attrs);
      }

      case "department": {
        return this.renderDepartment(attrs);
      }

      case "list": {
        return this.renderList(attrs);
      }

      case "objectList": {
        return this.renderObjectList(objectListConfigs, attrs);
      }

      case "map": {
        return this.renderMap(attrs);
      }
      case "isCheckUserTicket": {
        return this.renderIsCheckUserTicket(attrs);
      }

      case "selectProductCategory": {
        return this.renderSelectCategory(attrs);
      }

      case "parentField": {
        return this.renderParentField();
      }

      case "labelSelect": {
        return this.renderLabelSelect(objectListConfigs, attrs);
      }

      default:
        try {
          const plugins = ((window as any).plugins || []).filter(
            (plugin) => plugin.formsExtraFields
          );

          const filteredPlugin = plugins.find((plugin) =>
            plugin.formsExtraFields.find(
              (extraField) => extraField.type === type
            )
          );

          if (filteredPlugin) {
            return this.renderExtraFields(attrs, type, filteredPlugin);
          }

          return this.renderInput(attrs);
        } catch {
          return this.renderInput(attrs, true);
        }
    }
  }

  renderAddButton() {
    const { field } = this.props;
    const { objectListConfigs = [] } = field;

    if (field.type !== "objectList" || !field.objectListConfigs) {
      return null;
    }

    const onClick = () => {
      const object = objectListConfigs.reduce((previousValue, currentValue) => {
        previousValue[`${currentValue.key}`] = "";

        return previousValue;
      }, {});

      this.setState({ value: [object, ...this.state.value] });
    };

    return (
      <Button btnStyle="link" onClick={onClick}>
        <Icon icon="plus-circle" />
      </Button>
    );
  }

  render() {
    const { field, hasLogic, otherFields = [] } = this.props;

    const subFieldIds = otherFields
      .filter((f) => f.subFieldIds)
      .map((f) => f.subFieldIds)
      .flat();

    return (
      <FormGroup>
        <ControlLabel ignoreTrans={true} required={field.isRequired}>
          {field.text}
        </ControlLabel>
        {this.renderAddButton()}

        {hasLogic && <LogicIndicator>Logic</LogicIndicator>}
        {subFieldIds.includes(field._id) && (
          <LogicIndicator>Sub Field</LogicIndicator>
        )}
        {field.description ? (
          <div dangerouslySetInnerHTML={{ __html: field.description }} />
        ) : null}

        {this.renderControl()}
      </FormGroup>
    );
  }
}
