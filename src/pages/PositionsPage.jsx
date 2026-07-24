import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Grid,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPosition,
  deletePositions,
  duplicatePosition,
  getPositions,
  updatePosition,
} from "../api/positionApi";
import { createCv } from "../api/cvApi";
import { getAttributes } from "../api/attributeApi";
import { useEffect, useMemo, useState } from "react";
import {
  canCreateCv,
  canManagePositions,
  canViewPublishedCvs,
} from "../utils/roles";
import { PositionDiscussion } from "../components/PositionDiscussion";
import { useI18n } from "../i18n/i18nContext";

const { Title, Text } = Typography;

const SUPPORTED_ACCESS_RULE_TYPES = ["NUMERIC", "BOOLEAN", "STRING", "SELECT", "DATE"];

function getOperatorOptions(attributeType, t) {
  if (attributeType === "NUMERIC" || attributeType === "DATE") {
    return [
      { label: t("positions.operatorGte", "Greater than or equal"), value: "GTE" },
      { label: t("positions.operatorLte", "Less than or equal"), value: "LTE" },
      { label: t("positions.operatorEq", "Equals"), value: "EQ" },
    ];
  }

  if (attributeType === "BOOLEAN") {
    return [{ label: t("positions.operatorEq", "Equals"), value: "EQ" }];
  }

  if (attributeType === "STRING" || attributeType === "SELECT") {
    return [
      { label: t("positions.operatorEq", "Equals"), value: "EQ" },
      { label: t("positions.operatorIn", "In list"), value: "IN" },
    ];
  }

  return [];
}

function getNormalizedAccessRules(accessRules = [], attributesById) {
  return accessRules.map((rule, index) => {
    const attribute = attributesById.get(rule.attributeId);
    const type = attribute?.type;
    const normalizedRule = {
      attributeId: rule.attributeId,
      operator: rule.operator,
      sortOrder: typeof rule.sortOrder === "number" ? rule.sortOrder : index + 1,
    };

    if (type === "NUMERIC") {
      normalizedRule.numericValue = rule.numericValue;
    } else if (type === "BOOLEAN") {
      normalizedRule.booleanValue = rule.booleanValue;
    } else if (type === "DATE") {
      normalizedRule.dateValue = rule.dateValue ? dayjs(rule.dateValue) : null;
    } else if (type === "STRING" || type === "SELECT") {
      normalizedRule.stringValue =
        rule.operator === "IN"
          ? (rule.stringValue || "")
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean)
          : rule.stringValue || "";
    }

    return normalizedRule;
  });
}

function buildAccessRulesPayload(accessRules = [], attributesById) {
  return accessRules.map((rule, index) => {
    const attribute = attributesById.get(rule.attributeId);
    const type = attribute?.type;
    const payload = {
      attributeId: rule.attributeId,
      operator: rule.operator,
      sortOrder: index + 1,
    };

    if (type === "NUMERIC") {
      payload.numericValue = rule.numericValue;
    } else if (type === "BOOLEAN") {
      payload.booleanValue = rule.booleanValue;
    } else if (type === "DATE") {
      payload.dateValue = rule.dateValue ? dayjs(rule.dateValue).toISOString() : null;
    } else if (type === "STRING" || type === "SELECT") {
      payload.stringValue = Array.isArray(rule.stringValue)
        ? rule.stringValue.join(",")
        : rule.stringValue;
    }

    return payload;
  });
}

function syncRequiredAttributeIds(form, attributeIds) {
  const currentRequiredAttributeIds = form.getFieldValue("requiredAttributeIds");

  if (!Array.isArray(currentRequiredAttributeIds)) {
    return;
  }

  const allowedAttributeIds = new Set(attributeIds);
  const nextRequiredAttributeIds = currentRequiredAttributeIds.filter((attributeId) =>
    allowedAttributeIds.has(attributeId),
  );

  if (nextRequiredAttributeIds.length !== currentRequiredAttributeIds.length) {
    form.setFieldValue("requiredAttributeIds", nextRequiredAttributeIds);
  }
}

function AccessRulesEditor({ form, attributes, fieldName, t, isCompact }) {
  const isPublic = Form.useWatch("isPublic", form);
  const accessRules = Form.useWatch(fieldName, form) || [];
  const supportedAttributes = useMemo(
    () =>
      attributes.filter((attribute) =>
        SUPPORTED_ACCESS_RULE_TYPES.includes(attribute.type),
      ),
    [attributes],
  );
  const attributesById = useMemo(
    () => new Map(attributes.map((attribute) => [attribute.id, attribute])),
    [attributes],
  );

  if (isPublic) {
    return <Text type="secondary">{t("positions.publicHelper", "Public position is available to all authenticated candidates.")}</Text>;
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Text type="secondary">
        {t(
          "positions.restrictedHelper",
          "Candidate must match all rules to access this position.",
        )}
      </Text>

      <Form.List name={fieldName}>
        {(fields, { add, remove }) => (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {fields.map((field) => {
              const currentRule = accessRules[field.name] || {};
              const selectedAttribute = attributesById.get(currentRule.attributeId);
              const operatorOptions = getOperatorOptions(selectedAttribute?.type, t);
              const selectOptions =
                selectedAttribute?.options?.map((option) => ({
                  label: option.value,
                  value: option.value,
                })) || [];

              return (
                <Space
                  className="positions-access-rules__row"
                  key={field.key}
                  align="start"
                  wrap
                  style={{ display: "flex", width: "100%" }}
                >
                  <Form.Item
                    {...field}
                    label={t("positions.ruleAttribute", "Rule Attribute")}
                    name={[field.name, "attributeId"]}
                    rules={[{ required: true }]}
                    style={isCompact ? { width: "100%", flex: "1 1 100%" } : { minWidth: 220, flex: 1 }}
                  >
                    <Select
                      placeholder={t("positions.selectRuleAttribute", "Select attribute")}
                      options={supportedAttributes.map((attribute) => ({
                        label: `${attribute.name} (${attribute.type})`,
                        value: attribute.id,
                      }))}
                      onChange={() => {
                        const nextRules = [...accessRules];
                        nextRules[field.name] = {
                          attributeId: form.getFieldValue([fieldName, field.name, "attributeId"]),
                        };
                        form.setFieldValue(fieldName, nextRules);
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    {...field}
                    label={t("positions.operator", "Operator")}
                    name={[field.name, "operator"]}
                    rules={[{ required: true }]}
                    style={isCompact ? { width: "100%", flex: "1 1 100%" } : { minWidth: 180 }}
                  >
                    <Select
                      placeholder={t("positions.selectRuleOperator", "Select operator")}
                      options={operatorOptions}
                    />
                  </Form.Item>

                  <Form.Item
                    {...field}
                    label={t("positions.value", "Value")}
                    name={[field.name, selectedAttribute?.type === "NUMERIC"
                      ? "numericValue"
                      : selectedAttribute?.type === "BOOLEAN"
                        ? "booleanValue"
                        : selectedAttribute?.type === "DATE"
                          ? "dateValue"
                          : "stringValue"]}
                    rules={[{ required: true }]}
                    style={isCompact ? { width: "100%", flex: "1 1 100%" } : { minWidth: 220, flex: 1 }}
                  >
                    {selectedAttribute?.type === "NUMERIC" ? (
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder={t("positions.enterRuleValue", "Enter value")}
                      />
                    ) : selectedAttribute?.type === "BOOLEAN" ? (
                      <Select
                        placeholder={t("positions.enterRuleValue", "Enter value")}
                        options={[
                          { label: t("common.yes", "Yes"), value: true },
                          { label: t("common.no", "No"), value: false },
                        ]}
                      />
                    ) : selectedAttribute?.type === "DATE" ? (
                      <DatePicker style={{ width: "100%" }} />
                    ) : selectedAttribute?.type === "SELECT" &&
                      currentRule.operator === "EQ" &&
                      selectOptions.length > 0 ? (
                      <Select
                        placeholder={t("positions.enterRuleValue", "Enter value")}
                        options={selectOptions}
                      />
                    ) : selectedAttribute?.type === "SELECT" &&
                      currentRule.operator === "IN" &&
                      selectOptions.length > 0 ? (
                      <Select
                        mode="multiple"
                        placeholder={t("positions.enterRuleValues", "Enter comma-separated values")}
                        options={selectOptions}
                      />
                    ) : currentRule.operator === "IN" ? (
                      <Select
                        mode="tags"
                        tokenSeparators={[","]}
                        placeholder={t("positions.enterRuleValues", "Enter comma-separated values")}
                      />
                    ) : (
                      <Input
                        placeholder={t("positions.enterRuleValue", "Enter value")}
                      />
                    )}
                  </Form.Item>

                  <Button
                    danger
                    className="positions-access-rules__remove"
                    style={{ marginTop: isCompact ? 0 : 30 }}
                    onClick={() => remove(field.name)}
                  >
                    {t("positions.removeRule", "Remove Rule")}
                  </Button>
                </Space>
              );
            })}

            <Button
              onClick={() =>
                add({
                  operator: undefined,
                })
              }
            >
              {t("positions.addRule", "Add Rule")}
            </Button>
          </Space>
        )}
      </Form.List>
    </Space>
  );
}

export function PositionsPage({ user, onViewPublishedCvs }) {
  const { t } = useI18n();
  const screens = Grid.useBreakpoint();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [selectedPositionIds, setSelectedPositionIds] = useState([]);

  const [form] = Form.useForm();
  const watchedCreateAttributeIds = Form.useWatch("attributeIds", form);
  const selectedCreateAttributeIds = useMemo(
    () => watchedCreateAttributeIds || [],
    [watchedCreateAttributeIds],
  );
  const [editForm] = Form.useForm();
  const watchedEditAttributeIds = Form.useWatch("attributeIds", editForm);
  const selectedEditAttributeIds = useMemo(
    () => watchedEditAttributeIds || [],
    [watchedEditAttributeIds],
  );
  const queryClient = useQueryClient();
  const positionsQueryKey = ["positions", user?.id || "guest"];

  useEffect(() => {
    syncRequiredAttributeIds(form, selectedCreateAttributeIds);
  }, [form, selectedCreateAttributeIds]);

  useEffect(() => {
    syncRequiredAttributeIds(editForm, selectedEditAttributeIds);
  }, [editForm, selectedEditAttributeIds]);

  const createPositionMutation = useMutation({
    mutationFn: createPosition,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: positionsQueryKey });
      form.resetFields();
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      message.error(error.response?.data?.message || t("common.error", "Error"));
    },
  });

  const deletePositionsMutation = useMutation({
    mutationFn: deletePositions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: positionsQueryKey });
      setSelectedPositionIds([]);
    },
  });

  const duplicatePositionMutation = useMutation({
    mutationFn: duplicatePosition,
    onSuccess: async () => {
      message.success(t("positions.duplicateSuccess", "Position duplicated successfully"));
      await queryClient.invalidateQueries({ queryKey: positionsQueryKey });
      setSelectedPositionIds([]);
    },
    onError: (error) => {
      if (error.response?.status === 403) {
        message.warning(
          t(
            "positions.duplicateForbidden",
            "Only recruiters/admins can duplicate positions.",
          ),
        );
        return;
      }

      if (error.response?.status === 404) {
        message.error(t("positions.duplicateNotFound", "Source position was not found."));
        return;
      }

      message.error(
        error.response?.data?.message ||
          t("positions.duplicateError", "Failed to duplicate position"),
      );
    },
  });

  const updatePositionMutation = useMutation({
    mutationFn: ({ id, values }) => updatePosition(id, values),
    onSuccess: async (updatedPosition) => {
      message.success(
        t("positions.updateSuccess", "Position updated successfully"),
      );
      queryClient.setQueryData(positionsQueryKey, (currentPositions = []) =>
        currentPositions.map((position) =>
          position.id === updatedPosition.id ? updatedPosition : position,
        ),
      );
      await queryClient.invalidateQueries({ queryKey: positionsQueryKey });
      setIsEditModalOpen(false);
      setSelectedPositionIds([]);
      editForm.resetFields();
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        message.warning(
          error.response?.data?.message ||
            "Position was changed by someone else. Please reload and try again.",
        );
        return;
      }

      if (error.response?.status === 403) {
        message.warning(
          error.response?.data?.message ||
            "Only recruiters/admins can update positions",
        );
        return;
      }

      message.error(error.response?.data?.message || t("common.error", "Error"));
    },
  });

  const createCvMutation = useMutation({
    mutationFn: createCv,
    onSuccess: () => {
      message.success(t("positions.cvCreated", "CV created successfully"));
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        message.warning(t("positions.cvExists", "CV already exists for this position"));
        return;
      }

      if (error.response?.status === 403) {
        message.warning(
          error.response?.data?.message ||
            t("positions.accessDenied", "You do not have access to this position."),
        );
        return;
      }

      message.error(t("positions.cvCreateError", "Failed to create CV"));
    },
  });

  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: positionsQueryKey,
    queryFn: getPositions,
  });

  const selectedPosition = data.find(
    (position) => position.id === selectedPositionIds[0],
  );

  const { data: attributes = [], isLoading: isAttributesLoading } = useQuery({
    queryKey: ["attributes"],
    queryFn: getAttributes,
  });

  const attributesById = useMemo(
    () => new Map(attributes.map((attribute) => [attribute.id, attribute])),
    [attributes],
  );

  const columns = [
    {
      title: t("positions.titleColumn", "Title"),
      dataIndex: "title",
      key: "title",
    },
    {
      title: t("positions.description", "Description"),
      dataIndex: "shortDescription",
      key: "shortDescription",
      render: (description) =>
        description || (
          <Text type="secondary">{t("common.noDescription", "No description")}</Text>
        ),
    },
    {
      title: t("positions.access", "Access"),
      dataIndex: "isPublic",
      key: "isPublic",
      render: (isPublic) => (
        <Tag color={isPublic ? "green" : "orange"}>
          {isPublic
            ? t("access.public", "Public")
            : t("access.restricted", "Restricted")}
        </Tag>
      ),
    },
    {
      title: t("positions.rules", "Rules"),
      dataIndex: "accessRulesCount",
      key: "accessRulesCount",
      width: 100,
      render: (value) => value ?? 0,
    },
    {
      title: t("positions.maxProjects", "Max Projects"),
      dataIndex: "maxProjects",
      key: "maxProjects",
      className: "positions-table__max-projects",
      width: 140,
    },
    {
      title: t("positions.projectTags", "Project Tags"),
      dataIndex: "projectTags",
      key: "projectTags",
      render: (projectTags) => {
        if (!projectTags || projectTags.length === 0) {
          return <Text type="secondary">{t("common.noTags", "No tags")}</Text>;
        }

        return (
          <Space wrap className="responsive-tag-list">
            {projectTags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: t("positions.attributes", "Attributes"),
      dataIndex: "attributes",
      key: "attributes",
      render: (positionAttributes) => {
        if (!positionAttributes || positionAttributes.length === 0) {
          return (
            <Text type="secondary">
              {t("cvPreview.noAttributes", "No attributes found")}
            </Text>
          );
        }

        return (
          <Space wrap className="responsive-tag-list">
            {positionAttributes.map((item) => (
              <Tag key={item.id}>
                {item.attribute.name}
                {item.isRequired ? " *" : ""}
              </Tag>
            ))}
          </Space>
        );
      },
    },
  ];

  if (isError) {
    return (
      <Text type="danger">{t("positions.loadError", "Failed to load positions")}</Text>
    );
  }

  const showCreateCv = canCreateCv(user);
  const showManagePositions = canManagePositions(user);
  const showViewPublishedCvs = canViewPublishedCvs(user);

  function openEditModal() {
    if (!selectedPosition) {
      return;
    }

    editForm.setFieldsValue({
      title: selectedPosition.title,
      shortDescription: selectedPosition.shortDescription,
      isPublic: selectedPosition.isPublic,
      maxProjects: selectedPosition.maxProjects,
      projectTags: selectedPosition.projectTags,
      version: selectedPosition.version,
      attributeIds: selectedPosition.attributes.map((item) => item.attributeId),
      requiredAttributeIds: selectedPosition.attributes
        .filter((item) => item.isRequired)
        .map((item) => item.attributeId),
      accessRules: getNormalizedAccessRules(
        selectedPosition.accessRules || [],
        attributesById,
      ),
    });

    setIsEditModalOpen(true);
  }

  function buildPositionPayload(values) {
    return {
      title: values.title,
      shortDescription: values.shortDescription,
      isPublic: values.isPublic,
      maxProjects: values.maxProjects,
      projectTags: values.projectTags || [],
      attributes: (values.attributeIds || []).map((attributeId, index) => ({
        attributeId,
        isRequired: values.requiredAttributeIds?.includes(attributeId) || false,
        sortOrder: index + 1,
      })),
      accessRules: values.isPublic
        ? []
        : buildAccessRulesPayload(values.accessRules || [], attributesById),
    };
  }

  return (
    <div className="responsive-page">
      <div className="responsive-page__header responsive-page__header--primary-action">
        <div className="responsive-page__title-group">
          <Title level={2} className="responsive-page__title" style={{ margin: 0 }}>
            {t("positions.title", "Positions")}
          </Title>
        </div>

        {showManagePositions ? (
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            {t("positions.createPosition", "Create Position")}
          </Button>
        ) : null}
      </div>

      <div className="responsive-toolbar responsive-toolbar--actions" style={{ marginBottom: 16 }}>
          <Text className="responsive-toolbar__meta" type="secondary">
            {t("common.selected", "Selected")}: {selectedPositionIds.length}
          </Text>

          {selectedPositionIds.length > 1 ? (
            <Text className="responsive-toolbar__note" type="warning">
              {t("positions.selectOneAction", "Select only one position for toolbar actions")}
            </Text>
          ) : null}

          {showCreateCv ? (
            <Button
              disabled={selectedPositionIds.length !== 1}
              loading={createCvMutation.isPending}
              onClick={() => {
                if (!selectedPosition) return;

                createCvMutation.mutate(selectedPosition.id);
              }}
            >
              {t("positions.createCv", "Create CV")}
            </Button>
          ) : null}

          {showViewPublishedCvs ? (
            <Button
              disabled={selectedPositionIds.length !== 1}
              onClick={() => {
                if (!selectedPosition) return;

                onViewPublishedCvs?.(selectedPosition.id);
              }}
            >
              {t("positions.viewPublishedCvs", "View Published CVs")}
            </Button>
          ) : null}

          <Button
            disabled={selectedPositionIds.length !== 1}
            onClick={() => {
              if (!selectedPosition) return;

              setIsDiscussionOpen(true);
            }}
          >
            {t("positions.discussion", "Discussion")}
          </Button>

          {showManagePositions ? (
            <Button
              disabled={selectedPositionIds.length !== 1}
              onClick={openEditModal}
            >
              {t("positions.editSelected", "Edit Selected")}
            </Button>
          ) : null}

          {showManagePositions ? (
            <Button
              disabled={selectedPositionIds.length !== 1}
              loading={duplicatePositionMutation.isPending}
              onClick={() => {
                if (!selectedPosition) return;

                duplicatePositionMutation.mutate(selectedPosition.id);
              }}
            >
              {t("positions.duplicateSelected", "Duplicate Selected")}
            </Button>
          ) : null}

          {showManagePositions ? (
            <Button
              danger
              disabled={selectedPositionIds.length === 0}
              loading={deletePositionsMutation.isPending}
              onClick={() => {
                Modal.confirm({
                  title: t("positions.deleteConfirmTitle", "Delete selected positions?"),
                  content: t(
                    "positions.deleteConfirmBody",
                    "This action will delete selected position templates.",
                  ),
                  okText: t("common.delete", "Delete"),
                  okButtonProps: { danger: true },
                  onOk: () => deletePositionsMutation.mutate(selectedPositionIds),
                });
              }}
            >
              {t("positions.deleteSelected", "Delete Selected")}
            </Button>
          ) : null}
      </div>

      <Table
        className="responsive-table"
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
        scroll={!screens.lg ? { x: 1400 } : undefined}
        rowSelection={{
          selectedRowKeys: selectedPositionIds,
          onChange: setSelectedPositionIds,
        }}
      />

      <PositionDiscussion
        open={isDiscussionOpen}
        positionId={selectedPosition?.id}
        positionTitle={selectedPosition?.title}
        onClose={() => setIsDiscussionOpen(false)}
      />

      {showManagePositions ? (
        <Modal
          className="responsive-modal"
          title={t("positions.createPosition", "Create Position")}
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          footer={null}
          width={screens.lg ? 900 : "calc(100vw - 24px)"}
        >
          <Form
            className="responsive-form"
            form={form}
            layout="vertical"
            initialValues={{
              isPublic: true,
              maxProjects: 3,
              accessRules: [],
            }}
            onFinish={(values) => {
              createPositionMutation.mutate(buildPositionPayload(values));
            }}
          >
            <Form.Item
              label={t("positions.titleColumn", "Title")}
              name="title"
              rules={[
                {
                  required: true,
                  message: t(
                    "positions.positionTitleRequired",
                    "Position title is required",
                  ),
                },
              ]}
            >
              <Input
                placeholder={t(
                  "positions.titlePlaceholder",
                  "Example: Frontend Developer",
                )}
              />
            </Form.Item>
            <Form.Item
              label={t("positions.shortDescription", "Short Description")}
              name="shortDescription"
            >
              <Input.TextArea
                rows={3}
                placeholder={t(
                  "positions.shortDescriptionPlaceholder",
                  "Short description for candidates",
                )}
              />
            </Form.Item>
            <Form.Item
              label={t("positions.publicPosition", "Public Position")}
              name="isPublic"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label={t("positions.accessRules", "Access Rules")}
              style={{ marginBottom: 16 }}
            >
              <AccessRulesEditor
                form={form}
                fieldName="accessRules"
                attributes={attributes}
                t={t}
                isCompact={!screens.md}
              />
            </Form.Item>
            <Form.Item
              label={t("positions.maxProjects", "Max Projects")}
              name="maxProjects"
            >
              <InputNumber min={0} max={10} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label={t("positions.projectTags", "Project Tags")}
              name="projectTags"
            >
              <Select
                mode="tags"
                placeholder={t("positions.projectTagsPlaceholder", "Add project tags")}
              />
            </Form.Item>
            <Form.Item
              label={t("positions.positionAttributes", "Position Attributes")}
              name="attributeIds"
              rules={[
                {
                  required: true,
                  message: t(
                    "positions.selectAtLeastOneAttribute",
                    "Select at least one attribute",
                  ),
                },
              ]}
            >
              <Select
                mode="multiple"
                loading={isAttributesLoading}
                placeholder={t(
                  "positions.attributesPlaceholder",
                  "Select attributes for this position",
                )}
                options={attributes.map((attribute) => ({
                  label: `${attribute.name} (${attribute.type})`,
                  value: attribute.id,
                }))}
              />
            </Form.Item>
            {selectedCreateAttributeIds.length > 0 ? (
              <Form.Item
                label={t("positions.requiredAttributes", "Required Attributes")}
                name="requiredAttributeIds"
              >
                <Checkbox.Group
                  options={attributes
                    .filter((attribute) =>
                      selectedCreateAttributeIds.includes(attribute.id),
                    )
                    .map((attribute) => ({
                      label: attribute.name,
                      value: attribute.id,
                    }))}
                />
              </Form.Item>
            ) : null}
            <Button
              type="primary"
              htmlType="submit"
              loading={createPositionMutation.isPending}
            >
              {t("positions.savePosition", "Save Position")}
            </Button>
          </Form>
        </Modal>
      ) : null}

      {showManagePositions ? (
        <Modal
          className="responsive-modal"
          title={t("positions.editPosition", "Edit Position")}
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          footer={null}
          width={screens.lg ? 900 : "calc(100vw - 24px)"}
        >
          <Form
            className="responsive-form"
            form={editForm}
            layout="vertical"
            onFinish={(values) => {
              if (!selectedPosition) {
                return;
              }

              updatePositionMutation.mutate({
                id: selectedPosition.id,
                values: {
                  ...buildPositionPayload(values),
                  version: values.version,
                },
              });
            }}
          >
            <Form.Item
              label={t("positions.titleColumn", "Title")}
              name="title"
              rules={[
                {
                  required: true,
                  message: t(
                    "positions.positionTitleRequired",
                    "Position title is required",
                  ),
                },
              ]}
            >
              <Input
                placeholder={t(
                  "positions.titlePlaceholder",
                  "Example: Frontend Developer",
                )}
              />
            </Form.Item>
            <Form.Item
              label={t("positions.shortDescription", "Short Description")}
              name="shortDescription"
            >
              <Input.TextArea
                rows={3}
                placeholder={t(
                  "positions.shortDescriptionPlaceholder",
                  "Short description for candidates",
                )}
              />
            </Form.Item>
            <Form.Item
              label={t("positions.publicPosition", "Public Position")}
              name="isPublic"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label={t("positions.accessRules", "Access Rules")}
              style={{ marginBottom: 16 }}
            >
              <AccessRulesEditor
                form={editForm}
                fieldName="accessRules"
                attributes={attributes}
                t={t}
                isCompact={!screens.md}
              />
            </Form.Item>
            <Form.Item
              label={t("positions.maxProjects", "Max Projects")}
              name="maxProjects"
            >
              <InputNumber min={0} max={10} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label={t("positions.projectTags", "Project Tags")}
              name="projectTags"
            >
              <Select
                mode="tags"
                placeholder={t("positions.projectTagsPlaceholder", "Add project tags")}
              />
            </Form.Item>
            <Form.Item
              label={t("positions.positionAttributes", "Position Attributes")}
              name="attributeIds"
              rules={[
                {
                  required: true,
                  message: t(
                    "positions.selectAtLeastOneAttribute",
                    "Select at least one attribute",
                  ),
                },
              ]}
            >
              <Select
                mode="multiple"
                loading={isAttributesLoading}
                placeholder={t(
                  "positions.attributesPlaceholder",
                  "Select attributes for this position",
                )}
                options={attributes.map((attribute) => ({
                  label: `${attribute.name} (${attribute.type})`,
                  value: attribute.id,
                }))}
              />
            </Form.Item>
            {selectedEditAttributeIds.length > 0 ? (
              <Form.Item
                label={t("positions.requiredAttributes", "Required Attributes")}
                name="requiredAttributeIds"
              >
                <Checkbox.Group
                  options={attributes
                    .filter((attribute) =>
                      selectedEditAttributeIds.includes(attribute.id),
                    )
                    .map((attribute) => ({
                      label: attribute.name,
                      value: attribute.id,
                    }))}
                />
              </Form.Item>
            ) : null}
            <Form.Item name="version" hidden>
              <Input />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={updatePositionMutation.isPending}
            >
              {t("projects.saveChanges", "Save Changes")}
            </Button>
          </Form>
        </Modal>
      ) : null}
    </div>
  );
}
