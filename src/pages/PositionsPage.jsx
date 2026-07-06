import {
  Button,
  Form,
  Input,
  InputNumber,
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
} from "../api/positionApi";
import { getAttributes } from "../api/attributeApi";
import { useState } from "react";

const { Title, Text } = Typography;

export function PositionsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPositionIds, setSelectedPositionIds] = useState([]);

  const [form] = Form.useForm();
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

  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["positions"],
    queryFn: getPositions,
  });

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
              <Tag key={item.id}>{item.attribute.name}</Tag>
            ))}
          </Space>
        );
      },
    },
  ];

  if (isError) {
    return <Text type="danger">Failed to load positions</Text>;
  }

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

          <Button disabled={selectedPositionIds.length !== 1}>
            Edit Selected
          </Button>

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
        </Space>

        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
          Create Position
        </Button>
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
                isRequired: false,
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
          <Button
            type="primary"
            htmlType="submit"
            loading={createPositionMutation.isPending}
          >
            Save Position
          </Button>
        </Form>{" "}
      </Modal>
    </div>
  );
}
