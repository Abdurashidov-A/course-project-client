import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  Tag,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAttribute, getAttributes } from "../api/attributeApi";
import { useState } from "react";

const { Title, Text } = Typography;

const categoryOptions = [
  { label: "Personal Information", value: "PERSONAL_INFORMATION" },
  { label: "Certification", value: "CERTIFICATION" },
  { label: "Domain Knowledge", value: "DOMAIN_KNOWLEDGE" },
  { label: "Soft Skills", value: "SOFT_SKILLS" },
  { label: "Technical Skills", value: "TECHNICAL_SKILLS" },
  { label: "Language", value: "LANGUAGE" },
  { label: "Education", value: "EDUCATION" },
  { label: "Experience", value: "EXPERIENCE" },
  { label: "Other", value: "OTHER" },
];

const typeOptions = [
  { label: "String", value: "STRING" },
  { label: "Text", value: "TEXT" },
  { label: "Image", value: "IMAGE" },
  { label: "Numeric", value: "NUMERIC" },
  { label: "Date", value: "DATE" },
  { label: "Period", value: "PERIOD" },
  { label: "Boolean", value: "BOOLEAN" },
  { label: "Dropdown", value: "SELECT" },
];

export function AttributeLibraryPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const createAttributeMutation = useMutation({
    mutationFn: createAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      form.resetFields();
      setIsCreateModalOpen(false);
    },
  });

  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["attributes"],
    queryFn: getAttributes,
  });

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => <Tag>{category}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description) =>
        description || <Text type="secondary">No description</Text>,
    },
  ];

  if (isError) {
    return <Text type="danger">Failed to load attributes</Text>;
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
          Attribute Library
        </Title>

        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
          Create Attribute
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Create Attribute"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createAttributeMutation.mutate(values)}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Attribute name is required" }]}
          >
            <Input placeholder="Example: English Level" />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: "Category is required" }]}
          >
            <Select placeholder="Select category" options={categoryOptions} />
          </Form.Item>

          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: "Type is required" }]}
          >
            <Select placeholder="Select type" options={typeOptions} />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Short explanation for recruiters and candidates"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={createAttributeMutation.isPending}
          >
            Save Attribute
          </Button>
        </Form>{" "}
      </Modal>
    </div>
  );
}
