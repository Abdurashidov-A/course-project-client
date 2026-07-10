import {
  Alert,
  Button,
  Checkbox,
  Form,
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
import { useState } from "react";
import {
  canCreateCv,
  canManagePositions,
  canViewPublishedCvs,
} from "../utils/roles";
import { PositionDiscussion } from "../components/PositionDiscussion";
import { useI18n } from "../i18n/I18nProvider";

const { Title, Text } = Typography;

export function PositionsPage({ user, onViewPublishedCvs }) {
  const { t } = useI18n();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [selectedPositionIds, setSelectedPositionIds] = useState([]);

  const [form] = Form.useForm();
  const selectedCreateAttributeIds = Form.useWatch("attributeIds", form) || [];
  const [editForm] = Form.useForm();
  const selectedEditAttributeIds =
    Form.useWatch("attributeIds", editForm) || [];
  const queryClient = useQueryClient();

  const createPositionMutation = useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      form.resetFields();
      setIsCreateModalOpen(false);
    },
  });

  const deletePositionsMutation = useMutation({
    mutationFn: deletePositions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setSelectedPositionIds([]);
    },
  });

  const duplicatePositionMutation = useMutation({
    mutationFn: duplicatePosition,
    onSuccess: () => {
      message.success(t("positions.duplicateSuccess", "Position duplicated successfully"));
      queryClient.invalidateQueries({ queryKey: ["positions"] });
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

      message.error(t("positions.duplicateError", "Failed to duplicate position"));
    },
  });

  const updatePositionMutation = useMutation({
    mutationFn: ({ id, values }) => updatePosition(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setIsEditModalOpen(false);
      setSelectedPositionIds([]);
      editForm.resetFields();
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

      message.error(t("positions.cvCreateError", "Failed to create CV"));
    },
  });

  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["positions"],
    queryFn: getPositions,
  });

  const selectedPosition = data.find(
    (position) => position.id === selectedPositionIds[0],
  );

  const { data: attributes = [], isLoading: isAttributesLoading } = useQuery({
    queryKey: ["attributes"],
    queryFn: getAttributes,
  });

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
        description || <Text type="secondary">{t("common.noDescription", "No description")}</Text>,
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
      title: t("positions.maxProjects", "Max Projects"),
      dataIndex: "maxProjects",
      key: "maxProjects",
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
          <Space wrap>
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
      render: (attributes) => {
        if (!attributes || attributes.length === 0) {
          return <Text type="secondary">{t("cvPreview.noAttributes", "No attributes found")}</Text>;
        }

        return (
          <Space wrap>
            {attributes.map((item) => (
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
    return <Text type="danger">{t("positions.loadError", "Failed to load positions")}</Text>;
  }

  const showCreateCv = canCreateCv(user);
  const showManagePositions = canManagePositions(user);
  const showViewPublishedCvs = canViewPublishedCvs(user);

  return (
    <div>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          {t("positions.title", "Positions")}
        </Title>

        <Space style={{ marginBottom: 16 }} wrap>
          <Text type="secondary">
            {t("common.selected", "Selected")}: {selectedPositionIds.length}
          </Text>

          {selectedPositionIds.length > 1 ? (
            <Text type="warning">
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
              onClick={() => {
                if (!selectedPosition) return;

                editForm.setFieldsValue({
                  title: selectedPosition.title,
                  shortDescription: selectedPosition.shortDescription,
                  isPublic: selectedPosition.isPublic,
                  maxProjects: selectedPosition.maxProjects,
                  projectTags: selectedPosition.projectTags,
                  version: selectedPosition.version,
                  attributeIds: selectedPosition.attributes.map(
                    (item) => item.attributeId,
                  ),
                  requiredAttributeIds: selectedPosition.attributes
                    .filter((item) => item.isRequired)
                    .map((item) => item.attributeId),
                });

                setIsEditModalOpen(true);
              }}
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
        </Space>

        {showManagePositions ? (
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            {t("positions.createPosition", "Create Position")}
          </Button>
        ) : null}
      </Space>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
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
          title={t("positions.createPosition", "Create Position")}
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => {
              createPositionMutation.mutate({
                title: values.title,
                shortDescription: values.shortDescription,
                isPublic: values.isPublic,
                maxProjects: values.maxProjects,
                projectTags: values.projectTags || [],
                attributes: values.attributeIds.map((attributeId) => ({
                  attributeId,
                  isRequired:
                    values.requiredAttributeIds?.includes(attributeId) || false,
                })),
              });
            }}
          >
            <Form.Item
              label={t("positions.titleColumn", "Title")}
              name="title"
              rules={[{ required: true, message: t("positions.positionTitleRequired", "Position title is required") }]}
            >
              <Input placeholder={t("positions.titlePlaceholder", "Example: Frontend Developer")} />
            </Form.Item>
            <Form.Item label={t("positions.shortDescription", "Short Description")} name="shortDescription">
              <Input.TextArea
                rows={3}
                placeholder={t("positions.shortDescriptionPlaceholder", "Short description for candidates")}
              />
            </Form.Item>
            <Form.Item
              label={t("positions.publicPosition", "Public Position")}
              name="isPublic"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </Form.Item>
            <Form.Item label={t("positions.maxProjects", "Max Projects")} name="maxProjects" initialValue={3}>
              <InputNumber min={0} max={10} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label={t("positions.projectTags", "Project Tags")} name="projectTags">
              <Select mode="tags" placeholder={t("positions.projectTagsPlaceholder", "Add project tags")} />
            </Form.Item>
            <Form.Item
              label={t("positions.positionAttributes", "Position Attributes")}
              name="attributeIds"
              rules={[
                { required: true, message: t("positions.selectAtLeastOneAttribute", "Select at least one attribute") },
              ]}
            >
              <Select
                mode="multiple"
                loading={isAttributesLoading}
                placeholder={t("positions.attributesPlaceholder", "Select attributes for this position")}
                options={attributes.map((attribute) => ({
                  label: `${attribute.name} (${attribute.type})`,
                  value: attribute.id,
                }))}
              />
            </Form.Item>
            {selectedCreateAttributeIds.length > 0 && (
              <Form.Item label={t("positions.requiredAttributes", "Required Attributes")} name="requiredAttributeIds">
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
            )}
            <Button
              type="primary"
              htmlType="submit"
              loading={createPositionMutation.isPending}
            >
              {t("positions.savePosition", "Save Position")}
            </Button>
          </Form>{" "}
        </Modal>
      ) : null}

      {showManagePositions ? (
        <Modal
          title={t("positions.editPosition", "Edit Position")}
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          footer={null}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={(values) => {
              if (!selectedPosition) return;

              updatePositionMutation.mutate({
                id: selectedPosition.id,
                values: {
                  title: values.title,
                  shortDescription: values.shortDescription,
                  isPublic: values.isPublic,
                  maxProjects: values.maxProjects,
                  projectTags: values.projectTags || [],
                  version: values.version,
                  attributes: values.attributeIds.map((attributeId) => ({
                    attributeId,
                    isRequired:
                      values.requiredAttributeIds?.includes(attributeId) || false,
                  })),
                },
              });
            }}
          >
          <Form.Item
            label={t("positions.titleColumn", "Title")}
            name="title"
            rules={[{ required: true, message: t("positions.positionTitleRequired", "Position title is required") }]}
          >
            <Input placeholder={t("positions.titlePlaceholder", "Example: Frontend Developer")} />
          </Form.Item>
          <Form.Item label={t("positions.shortDescription", "Short Description")} name="shortDescription">
            <Input.TextArea
              rows={3}
              placeholder={t("positions.shortDescriptionPlaceholder", "Short description for candidates")}
            />
          </Form.Item>
          <Form.Item
            label={t("positions.publicPosition", "Public Position")}
            name="isPublic"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item label={t("positions.maxProjects", "Max Projects")} name="maxProjects">
            <InputNumber min={0} max={10} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label={t("positions.projectTags", "Project Tags")} name="projectTags">
            <Select mode="tags" placeholder={t("positions.projectTagsPlaceholder", "Add project tags")} />
          </Form.Item>
          <Form.Item
            label={t("positions.positionAttributes", "Position Attributes")}
            name="attributeIds"
            rules={[
              { required: true, message: t("positions.selectAtLeastOneAttribute", "Select at least one attribute") },
            ]}
          >
            <Select
              mode="multiple"
              loading={isAttributesLoading}
              placeholder={t("positions.attributesPlaceholder", "Select attributes for this position")}
              options={attributes.map((attribute) => ({
                label: `${attribute.name} (${attribute.type})`,
                value: attribute.id,
              }))}
            />
          </Form.Item>
          {selectedEditAttributeIds.length > 0 && (
            <Form.Item label={t("positions.requiredAttributes", "Required Attributes")} name="requiredAttributeIds">
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
          )}
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
