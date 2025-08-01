import { removeParams, setParams } from "../../utils/router";
import { useLocation, useNavigate } from "react-router-dom";

import Chip from "../Chip";
import React from "react";
import { __ } from "../../utils/core";
import { cleanIntegrationKind } from "../../utils";
import createChipText from "./createChipText";
import { gql } from "@apollo/client";
import styled from "styled-components";

interface IProps {
  queryParams?: any;
  filterTitle?: string;
  extraFilterParams?: { param: string; bool: boolean; title?: string }[];
  extraFilterWithData?: { paramKey: string; type: string; fields?: string }[];
}

const Filters = styled.div`
  font-size: 0.9em;
`;

function Filter({
  queryParams = {},
  filterTitle,
  extraFilterParams,
  extraFilterWithData,
}: IProps) {
  const navigate = useNavigate();
  const location = useLocation() as any;

  const onClickClose = paramKey => {
    removeParams(navigate, location, ...paramKey);
  };

  const onClickRemove = (paramKey: string, ids: string[], id: string) => {
    if (ids.length === 1) {
      removeParams(navigate, location, paramKey);
    } else {
      const index = ids.indexOf(id);

      ids.splice(index, 1);

      setParams(navigate, location, { [paramKey]: ids.toString() });
    }
  };

  const renderFilterParam = (
    paramKey: string,
    bool: boolean,
    customText?: string
  ) => {
    if (!queryParams[paramKey]) {
      return null;
    }

    const onClick = () => onClickClose([paramKey]);

    const text = customText || paramKey;

    return (
      <Chip capitalize={true} onClick={onClick}>
        {bool ? text : __(cleanIntegrationKind(queryParams[paramKey]))}
      </Chip>
    );
  };

  const renderFilterWithData = (
    paramKey: string,
    type: string,
    fields = "_id name"
  ) => {
    if (queryParams[paramKey]) {
      const id = queryParams[paramKey];

      let graphqlQuery = gql`
        query ${type}Detail($id: String!) {
          ${type}Detail(_id: $id) {
            ${fields}
          }
        }
      `;

      if (type === "forum") {
        graphqlQuery = gql`
          query ForumCategoryDetail($id: ID!) {
            forumCategory(_id: $id) {
              _id
              name
            }
          }
        `;
      }

      const ids = id.split(",");

      if (ids.length > 1) {
        return ids.map((_id: string) => {
          const ChipText = createChipText(graphqlQuery, _id);

          return (
            <Chip
              onClick={onClickRemove.bind(null, paramKey, ids, _id)}
              key={_id}
            >
              <ChipText />
            </Chip>
          );
        });
      }

      const ChipText = createChipText(graphqlQuery, id);

      return (
        <Chip onClick={onClickClose.bind(null, [paramKey])}>
          <ChipText />
        </Chip>
      );
    }

    return null;
  };

  const renderFilterWithDate = () => {
    if (queryParams.startDate && queryParams.endDate) {
      const onClick = () => onClickClose(["startDate", "endDate"]);

      return (
        <Chip onClick={onClick}>
          {queryParams.startDate} - {queryParams.endDate}
        </Chip>
      );
    }

    if (queryParams.startDate || queryParams.endDate) {
      const onClick = () =>
        onClickClose([queryParams.startDate ? "startDate" : "endDate"]);

      return (
        <Chip onClick={onClick}>
          {queryParams.startDate || queryParams.endDate}
        </Chip>
      );
    }

    return null;
  };

  return (
    <Filters>
      {renderFilterWithData("channelId", "channel")}
      {renderFilterParam("status", false)}
      {renderFilterParam("state", false)}
      {renderFilterParam("categoryApprovalState", false)}
      {(location?.href || "").includes("forum") &&
        renderFilterWithData("categoryId", "forum")}
      {(location?.href || "").includes("product") &&
        renderFilterWithData(
          "categoryId",
          "productCategory",
          "_id, code, name"
        )}
      {renderFilterParam("participating", true)}
      {renderFilterParam("unassigned", true)}
      {renderFilterParam("awaitingResponse", true, "Awaiting Response")}
      {renderFilterWithData("brandId", "brand")}
      {renderFilterParam("integrationType", false)}
      {renderFilterWithData("tag", "tag")}
      {renderFilterWithData("segment", "segment")}
      {renderFilterParam("segmentData", true, "Temporary segment")}
      {renderFilterParam("kind", false)}
      {renderFilterWithData("brand", "brand")}
      {renderFilterWithDate()}
      {renderFilterWithData("form", "form", "_id title")}
      {renderFilterWithData("branchId", "branch", "_id title")}
      {renderFilterWithData("departmentId", "department", "_id title")}
      {renderFilterWithData("unitId", "unit", "_id title")}
      {renderFilterParam("groupId", true, filterTitle)}
      {renderFilterParam("tagType", true, filterTitle)}
      {renderFilterParam("contentType", true, filterTitle)}
      {renderFilterParam("type", false, filterTitle)}
      {renderFilterParam("bundle", false, filterTitle)}

      {renderFilterParam("action", false, filterTitle)}
      {renderFilterWithData("userId", "user", "details{fullName}, email")}
      {renderFilterWithData(
        "assetCategoryId",
        "assetCategory",
        "_id, code, name"
      )}
      {renderFilterWithData(
        "knowledgebaseCategoryId",
        "knowledgeBaseCategory",
        "_id, title"
      )}
      {renderFilterWithData("assetId", "asset", "_id, code, name")}
      {(extraFilterParams || []).map(af =>
        renderFilterParam(af.param, af.bool, af.title || af.param)
      )}
      {(extraFilterWithData || []).map(af =>
        renderFilterWithData(af.paramKey, af.type, af.fields)
      )}
    </Filters>
  );
}

export default Filter;
