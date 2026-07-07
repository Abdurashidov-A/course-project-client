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

const { Title, Text } = Typography;

export function PositionsPage({ user, onViewPublishedCvs }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
      message.success("CV created successfully");
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        message.warning("CV already exists for this position");
        return;
      }

      message.error("Failed to create CV");
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
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Description",
      dataIndex: "shortDescription",
      key: "shortDescription",
      render: (description) =>
        description || <Text type="secondary">No description</Text>,
    },
    {
      title: "Access",
      dataIndex: "isPublic",
      key: "isPublic",
      render: (isPublic) => (
        <Tag color={isPublic ? "green" : "orange"}>
          {isPublic ? "Public" : "Restricted"}
        </Tag>
      ),
    },
    {
      title: "Max Projects",
      dataIndex: "maxProjects",
      key: "maxProjects",
    },
    {
      title: "Attributes",
      dataIndex: "attributes",
      key: "attributes",
      render: (attributes) => {
        if (!attributes || attributes.length === 0) {
          return <Text type="secondary">No attributes</Text>;
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
    return <Text type="danger">Failed to load positions</Text>;
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
          Positions
        </Title>

        <Space style={{ marginBottom: 16 }} wrap>
          <Text type="secondary">Selected: {selectedPositionIds.length}</Text>

          {selectedPositionIds.length > 1 ? (
            <Text type="warning">
              Select only one position for toolbar actions
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
              Create CV
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
              View Published CVs
            </Button>
          ) : null}

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
              Edit Selected
            </Button>
          ) : null}

          {showManagePositions ? (
            <Button
              danger
              disabled={selectedPositionIds.length === 0}
              loading={deletePositionsMutation.isPending}
              onClick={() => {
                Modal.confirm({
                  title: "Delete selected positions?",
                  content: "This action will delete selected position templates.",
                  okText: "Delete",
                  okButtonProps: { danger: true },
                  onOk: () => deletePositionsMutation.mutate(selectedPositionIds),
                });
              }}
            >
              Delete Selected
            </Button>
          ) : null}
        </Space>

        {showManagePositions ? (
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            Create Position
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

      {showManagePositions ? (
        <Modal
          title="Create Position"
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
                attributes: values.attributeIds.map((attributeId) => ({
                  attributeId,
                  isRequired:
                    values.requiredAttributeIds?.includes(attributeId) || false,
                })),
              });
            }}
          >
            <Form.Item
              label="Title"
              name="title"
              rules={[{ required: true, message: "Position title is required" }]}
            >
              <Input placeholder="Example: Frontend Developer" />
            </Form.Item>
            <Form.Item label="Short Description" name="shortDescription">
              <Input.TextArea
                rows={3}
                placeholder="Short description for candidates"
              />
            </Form.Item>
            <Form.Item
              label="Public Position"
              name="isPublic"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </Form.Item>
            <Form.Item label="Max Projects" name="maxProjects" initialValue={3}>
              <InputNumber min={0} max={10} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="Position Attributes"
              name="attributeIds"
              rules={[
                { required: true, message: "Select at least one attribute" },
              ]}
            >
              <Select
                mode="multiple"
                loading={isAttributesLoading}
                placeholder="Select attributes for this position"
                options={attributes.map((attribute) => ({
                  label: `${attribute.name} (${attribute.type})`,
                  value: attribute.id,
                }))}
              />
            </Form.Item>
            {selectedCreateAttributeIds.length > 0 && (
              <Form.Item label="Required Attributes" name="requiredAttributeIds">
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
              Save Position
            </Button>
          </Form>{" "}
        </Modal>
      ) : null}

      {showManagePositions ? (
        <Modal
          title="Edit Position"
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
            label="Title"
            name="title"
            rules={[{ required: true, message: "Position title is required" }]}
          >
            <Input placeholder="Example: Frontend Developer" />
          </Form.Item>
          <Form.Item label="Short Description" name="shortDescription">
            <Input.TextArea
              rows={3}
              placeholder="Short description for candidates"
            />
          </Form.Item>
          <Form.Item
            label="Public Position"
            name="isPublic"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item label="Max Projects" name="maxProjects">
            <InputNumber min={0} max={10} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Position Attributes"
            name="attributeIds"
            rules={[
              { required: true, message: "Select at least one attribute" },
            ]}
          >
            <Select
              mode="multiple"
              loading={isAttributesLoading}
              placeholder="Select attributes for this position"
              options={attributes.map((attribute) => ({
                label: `${attribute.name} (${attribute.type})`,
                value: attribute.id,
              }))}
            />
          </Form.Item>
          {selectedEditAttributeIds.length > 0 && (
            <Form.Item label="Required Attributes" name="requiredAttributeIds">
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
            Save Changes
          </Button>
          </Form>
        </Modal>
      ) : null}
    </div>
  );
}
