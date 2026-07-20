import {
  Alert,
  Button,
  DatePicker,
  Empty,
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
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getCvById, likeCv, publishCv, unlikeCv } from "../api/cvApi";
import { saveProfileAttribute } from "../api/profileAttributeApi";
import { useI18n } from "../i18n/I18nProvider";
import { MarkdownText } from "../components/MarkdownText";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

function formatPeriod(start, end) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function renderAttributeValue(record, t) {
  const value = record.value;

  if (record.isMissing) {
    return <Text type="secondary">{t("missing.missing", "Missing")}</Text>;
  }

  if (record.type === "STRING" || record.type === "SELECT") {
    return value.stringValue || t("common.none", "—");
  }

  if (record.type === "TEXT") {
    return value.textValue || t("common.none", "—");
  }

  if (record.type === "NUMERIC") {
    return value.numericValue ?? t("common.none", "—");
  }

  if (record.type === "BOOLEAN") {
    if (value.booleanValue === null) {
      return t("common.none", "—");
    }

    return value.booleanValue ? t("common.yes", "Yes") : t("common.no", "No");
  }

  if (record.type === "DATE") {
    return formatDate(value.dateValue);
  }

  if (record.type === "PERIOD") {
    const start = formatDate(value.periodStart);
    const end = formatDate(value.periodEnd);

    return `${start} - ${end}`;
  }

  if (record.type === "IMAGE") {
    return value.imageUrl || t("common.none", "—");
  }

  return t("common.none", "—");
}

function getFormValue(attribute) {
  const value = attribute?.value;

  if (!attribute || !value || value.id === null) {
    return attribute?.type === "BOOLEAN" ? false : undefined;
  }

  if (attribute.type === "STRING" || attribute.type === "SELECT") {
    return value.stringValue || undefined;
  }

  if (attribute.type === "TEXT") {
    return value.textValue || undefined;
  }

  if (attribute.type === "NUMERIC") {
    return value.numericValue ?? undefined;
  }

  if (attribute.type === "BOOLEAN") {
    return Boolean(value.booleanValue);
  }

  if (attribute.type === "DATE") {
    return value.dateValue ? dayjs(value.dateValue) : undefined;
  }

  if (attribute.type === "PERIOD") {
    if (!value.periodStart && !value.periodEnd) {
      return undefined;
    }

    return [
      value.periodStart ? dayjs(value.periodStart) : null,
      value.periodEnd ? dayjs(value.periodEnd) : null,
    ];
  }

  if (attribute.type === "IMAGE") {
    return value.imageUrl || undefined;
  }

  return undefined;
}

function buildSavePayload(attribute, value) {
  const payload = {};

  if (attribute.value?.version !== null && attribute.value?.version !== undefined) {
    payload.version = attribute.value.version;
  }

  if (attribute.type === "PERIOD") {
    payload.value = {
      periodStart: value?.[0] ? value[0].toISOString() : null,
      periodEnd: value?.[1] ? value[1].toISOString() : null,
    };

    return payload;
  }

  if (attribute.type === "DATE") {
    payload.value = value ? value.toISOString() : null;

    return payload;
  }

  payload.value = value;

  return payload;
}

function renderValueInput(attribute, t) {
  if (!attribute) {
    return <Input disabled placeholder={t("profile.attributePlaceholder", "Select attribute")} />;
  }

  if (attribute.type === "TEXT") {
    return <TextArea rows={4} placeholder={t("cvPreview.value", "Value")} />;
  }

  if (attribute.type === "NUMERIC") {
    return <InputNumber style={{ width: "100%" }} placeholder={t("attributeType.NUMERIC", "Numeric")} />;
  }

  if (attribute.type === "BOOLEAN") {
    return (
      <Switch
        checkedChildren={t("common.yes", "Yes")}
        unCheckedChildren={t("common.no", "No")}
      />
    );
  }

  if (attribute.type === "DATE") {
    return <DatePicker style={{ width: "100%" }} />;
  }

  if (attribute.type === "PERIOD") {
    return <RangePicker style={{ width: "100%" }} />;
  }

  if (attribute.type === "IMAGE") {
    return <Input placeholder="https://..." />;
  }

  if (attribute.type === "SELECT" && attribute.options?.length > 0) {
    return (
      <Select
        style={{ width: "100%" }}
        placeholder={t("profile.value", "Value")}
        options={attribute.options.map((option) => ({
          label: option.value,
          value: option.value,
        }))}
      />
    );
  }

  return <Input placeholder={t("profile.value", "Value")} />;
}

export function CvPreviewPage({ cvId, onBack }) {
  const { t } = useI18n();
  const screens = Grid.useBreakpoint();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [missingPublishAttributes, setMissingPublishAttributes] = useState([]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["cv-preview", cvId],
    queryFn: () => getCvById(cvId),
    enabled: Boolean(cvId),
  });

  const selectedAttribute =
    data?.attributes?.find(
      (attribute) => attribute.positionAttributeId === selectedRowKeys[0],
    ) || null;
  const canEditValues = Boolean(data?.canEditValues);
  const canLike =
    (data?.viewerRole === "RECRUITER" || data?.viewerRole === "ADMIN") &&
    data?.status === "PUBLISHED";

  const saveMutation = useMutation({
    mutationFn: ({ attributeId, payload }) =>
      saveProfileAttribute(attributeId, payload),
    onSuccess: async () => {
      message.success(t("cvPreview.saveSuccess", "Profile attribute saved"));
      setMissingPublishAttributes([]);
      setIsModalOpen(false);
      setSelectedRowKeys([]);
      form.resetFields();
      await refetch();
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        message.warning(
          t(
            "cvPreview.saveConflict",
            "This value was changed elsewhere. Please reload and try again.",
          ),
        );
        return;
      }

      message.error(t("cvPreview.saveError", "Failed to save profile attribute"));
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, version }) => publishCv(id, version),
    onSuccess: async () => {
      message.success(t("cvPreview.publishSuccess", "CV published successfully"));
      setMissingPublishAttributes([]);
      await refetch();
    },
    onError: (error) => {
      if (error.response?.status === 400) {
        const missingAttributes = error.response?.data?.missingAttributes || [];
        setMissingPublishAttributes(missingAttributes);
        message.warning(
          t(
            "cvPreview.publishBlocked",
            "Cannot publish CV while some attributes are missing",
          ),
        );
        return;
      }

      if (error.response?.status === 409) {
        message.warning(t("cvPreview.publishConflict", "CV was changed elsewhere. Please reload and try again."));
        return;
      }

      message.error(t("cvPreview.publishError", "Failed to publish CV"));
    },
  });

  const likeMutation = useMutation({
    mutationFn: ({ shouldLike, id }) =>
      shouldLike ? likeCv(id) : unlikeCv(id),
    onSuccess: async (_, variables) => {
      message.success(
        variables.shouldLike
          ? t("cvPreview.likeAdded", "CV liked")
          : t("cvPreview.likeRemoved", "Like removed"),
      );
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["position-cvs"] }),
        queryClient.invalidateQueries({ queryKey: ["my-cvs"] }),
      ]);
    },
    onError: (error) => {
      if (error.response?.status === 403) {
        message.warning(error.response?.data?.message || t("cvPreview.likeError", "Failed to update CV like"));
        return;
      }

      message.error(t("cvPreview.likeError", "Failed to update CV like"));
    },
  });

  useEffect(() => {
    if (!isModalOpen || !selectedAttribute) {
      return;
    }

    form.setFieldsValue({
      value: getFormValue(selectedAttribute),
    });
  }, [form, isModalOpen, selectedAttribute]);

  const columns = [
    {
      title: t("cvPreview.attributeName", "Attribute Name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("attributeLibrary.category", "Category"),
      dataIndex: "category",
      key: "category",
      render: (category) => t(`attributeCategory.${category}`, category),
    },
    {
      title: t("attributeLibrary.type", "Type"),
      dataIndex: "type",
      key: "type",
      render: (type) => t(`attributeType.${type}`, type),
    },
    {
      title: t("cvPreview.required", "Required"),
      dataIndex: "isRequired",
      key: "isRequired",
      render: (isRequired) =>
        isRequired ? t("common.yes", "Yes") : t("common.no", "No"),
    },
    {
      title: t("cvPreview.value", "Value"),
      key: "value",
      render: (_, record) => renderAttributeValue(record, t),
    },
    {
      title: t("cvPreview.missing", "Missing"),
      dataIndex: "isMissing",
      key: "isMissing",
      render: (isMissing, record) =>
        isMissing ? (
          <Tag color={record.isRequired ? "red" : "orange"}>
            {t("missing.missing", "Missing")}
          </Tag>
        ) : (
          <Tag color="green">{t("missing.complete", "Complete")}</Tag>
        ),
    },
  ];

  const projectColumns = [
    {
      title: t("projects.name", "Name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("projects.period", "Period"),
      key: "period",
      render: (_, record) => formatPeriod(record.periodStart, record.periodEnd),
    },
    {
      title: t("projects.technologyTags", "Technology Tags"),
      dataIndex: "technologyTags",
      key: "technologyTags",
      render: (technologyTags) => {
        if (!technologyTags || technologyTags.length === 0) {
          return <Text type="secondary">{t("common.noTags", "No tags")}</Text>;
        }

        return (
          <Space wrap>
            {technologyTags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: t("projects.description", "Description"),
      dataIndex: "description",
      key: "description",
      render: (description) =>
        (
          <MarkdownText
            compact
            emptyText={t("common.noDescription", "No description")}
          >
            {description}
          </MarkdownText>
        ),
    },
  ];

  if (!cvId) {
    return (
      <Space direction="vertical" size="middle">
        <Button onClick={onBack}>{t("cvPreview.backToMyCvs", "Back to My CVs")}</Button>
        <Empty description={t("cvPreview.selectCv", "Select a CV to preview")} />
      </Space>
    );
  }

  if (isError) {
    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Button onClick={onBack}>{t("cvPreview.backToMyCvs", "Back to My CVs")}</Button>
        <Alert type="error" message={t("cvPreview.loadError", "Failed to load CV preview")} />
      </Space>
    );
  }

  function handleEditValue() {
    if (!selectedAttribute) {
      return;
    }

    setIsModalOpen(true);
  }

  function handleSubmit(values) {
    if (!selectedAttribute) {
      return;
    }

    saveMutation.mutate({
      attributeId: selectedAttribute.attributeId,
      payload: buildSavePayload(selectedAttribute, values.value),
    });
  }

  function handlePublish() {
    if (!data?.id || typeof data?.version !== "number") {
      return;
    }

    publishMutation.mutate({
      id: data.id,
      version: data.version,
    });
  }

  function handleLikeToggle() {
    if (!data?.id || !canLike) {
      return;
    }

    likeMutation.mutate({
      id: data.id,
      shouldLike: !data.likedByCurrentUser,
    });
  }

  return (
    <div className="responsive-page">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Button onClick={onBack} style={{ width: "fit-content" }}>
          {t("cvPreview.backToMyCvs", "Back to My CVs")}
        </Button>

        <div className="responsive-page__title-group">
          <Title level={2} className="responsive-page__title" style={{ marginBottom: 8 }}>
            {data?.position?.title || t("cvPreview.titleFallback", "CV Preview")}
          </Title>
          <MarkdownText
            className="markdown-text--muted responsive-page__subtitle"
            emptyText={t("common.noShortDescription", "No short description")}
          >
            {data?.position?.shortDescription}
          </MarkdownText>
        </div>

        <Space wrap className="responsive-toolbar">
          <Tag color="blue">
            {t("cvPreview.status", "Status")}: {t(`status.${data?.status}`, data?.status || "—")}
          </Tag>
          <Tag>
            {t("common.version", "Version")}: {data?.version ?? t("common.none", "—")}
          </Tag>
          <Tag color="purple">
            {t("cvPreview.likes", "Likes")}: {data?.likesCount ?? 0}
          </Tag>
          {canEditValues ? (
            <Button
              type="primary"
              disabled={data?.status === "PUBLISHED"}
              loading={publishMutation.isPending}
              onClick={handlePublish}
            >
              {data?.status === "PUBLISHED"
                ? t("status.PUBLISHED", "Published")
                : t("cvPreview.publish", "Publish")}
            </Button>
          ) : (
            <Tag color="default">{t("common.readOnly", "Read-only view")}</Tag>
          )}
          {canLike ? (
            <Button loading={likeMutation.isPending} onClick={handleLikeToggle}>
              {data?.likedByCurrentUser
                ? t("cvPreview.unlike", "Unlike")
                : t("cvPreview.like", "Like")}
            </Button>
          ) : null}
        </Space>

        {missingPublishAttributes.length > 0 ? (
          <Alert
            type="warning"
            message={t(
              "cvPreview.publishBlocked",
              "Cannot publish CV while some attributes are missing",
            )}
            description={missingPublishAttributes
              .map((attribute) => attribute.name)
              .join(", ")}
            showIcon
          />
        ) : null}

        {canEditValues ? (
          <Space wrap className="responsive-toolbar">
            <Text type="secondary">
              {t("common.selected", "Selected")}: {selectedRowKeys.length}
            </Text>
            {selectedRowKeys.length > 1 ? (
              <Text type="warning">
                {t("cvPreview.selectedOne", "Select only one attribute to edit")}
              </Text>
            ) : null}
            <Button
              disabled={selectedRowKeys.length !== 1}
              onClick={handleEditValue}
            >
              {t("cvPreview.editValue", "Edit Value")}
            </Button>
          </Space>
        ) : null}

        <Table
          className="responsive-table"
          rowKey="positionAttributeId"
          loading={isLoading}
          columns={columns}
          dataSource={data?.attributes || []}
          pagination={{ pageSize: 10 }}
          scroll={!screens.lg ? { x: 1100 } : undefined}
          rowSelection={
            canEditValues
              ? {
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                }
              : undefined
          }
          locale={{
            emptyText: <Empty description={t("cvPreview.noAttributes", "No attributes found")} />,
          }}
        />

        <div className="responsive-preview-section">
          <Title level={3} style={{ marginBottom: 12 }}>
            {t("cvPreview.projects", "Projects")}
          </Title>

          {data?.position?.projectTags?.length ? (
            <Space wrap className="responsive-tag-list" style={{ marginBottom: 12 }}>
              {data.position.projectTags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          ) : null}

          <Table
            className="responsive-table"
            rowKey="id"
            columns={projectColumns}
            dataSource={data?.projects || []}
            pagination={{ pageSize: 10 }}
            scroll={!screens.lg ? { x: 960 } : undefined}
            locale={{
              emptyText: <Empty description={t("cvPreview.noProjects", "No projects added yet.")} />,
            }}
          />
        </div>

        {canEditValues ? (
          <Modal
            className="responsive-modal"
            title={selectedAttribute ? `${t("common.edit", "Edit")} ${selectedAttribute.name}` : t("cvPreview.editModalTitle", "Edit Value")}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            onOk={() => form.submit()}
            confirmLoading={saveMutation.isPending}
            destroyOnHidden
            width={screens.md ? 720 : "calc(100vw - 24px)"}
          >
            <Form className="responsive-form" form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item label={t("profile.attribute", "Attribute")}>
                <Input value={selectedAttribute?.name} disabled />
              </Form.Item>

              <Form.Item
                key={selectedAttribute?.type || "empty"}
                label={t("cvPreview.value", "Value")}
                name="value"
                valuePropName={
                  selectedAttribute?.type === "BOOLEAN" ? "checked" : "value"
                }
              >
                {renderValueInput(selectedAttribute, t)}
              </Form.Item>
            </Form>
          </Modal>
        ) : null}
      </Space>
    </div>
  );
}
