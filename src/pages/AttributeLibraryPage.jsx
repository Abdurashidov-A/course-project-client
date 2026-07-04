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
import {
  createAttribute,
  deleteAttributes,
  getAttributes,
  updateAttribute,
} from "../api/attributeApi";
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState();

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();
  const selectedType = Form.useWatch("type", form);
  const selectedEditType = Form.useWatch("type", editForm);

  const createAttributeMutation = useMutation({
    mutationFn: createAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      form.resetFields();
      setIsCreateModalOpen(false);
    },
  });

  const deleteAttributesMutation = useMutation({
    mutationFn: deleteAttributes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      setSelectedAttributeIds([]);
    },
  });

  const updateAttributeMutation = useMutation({
    mutationFn: ({ id, values }) => updateAttribute(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      setIsEditModalOpen(false);
      setSelectedAttributeIds([]);
      editForm.resetFields();
    },
  });

  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["attributes", search, categoryFilter],
    queryFn: () =>
      getAttributes({
        search: search || undefined,
        category: categoryFilter,
      }),
  });

  const selectedAttribute = data.find(
    (attribute) => attribute.id === selectedAttributeIds[0],
  );

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
    {
      title: "Options",
      dataIndex: "options",
      key: "options",
      render: (options, record) => {
        if (record.type !== "SELECT") {
          return <Text type="secondary">—</Text>;
        }

        if (!options || options.length === 0) {
          return <Text type="secondary">No options</Text>;
        }

        return (
          <Space wrap>
            {options.map((option) => (
              <Tag key={option.id}>{option.value}</Tag>
            ))}
          </Space>
        );
      },
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

      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Search attributes by name"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ width: 280 }}
        />

        <Select
          placeholder="Filter by category"
          allowClear
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
          style={{ width: 220 }}
        />
      </Space>

      <Space style={{ marginBottom: 16 }} wrap>
        <Text type="secondary">Selected: {selectedAttributeIds.length}</Text>

        <Button
          disabled={selectedAttributeIds.length !== 1}
          onClick={() => {
            if (!selectedAttribute) return;

            editForm.setFieldsValue({
              name: selectedAttribute.name,
              category: selectedAttribute.category,
              type: selectedAttribute.type,
              description: selectedAttribute.description,
              version: selectedAttribute.version,
              options: selectedAttribute.options?.map((option) => ({
                value: option.value,
              })),
            });

            setIsEditModalOpen(true);
          }}
        >
          Edit Selected
        </Button>

        <Button
          danger
          disabled={selectedAttributeIds.length === 0}
          loading={deleteAttributesMutation.isPending}
          onClick={() => {
            Modal.confirm({
              title: "Delete selected attributes?",
              content:
                "This action will also delete dropdown options for selected attributes.",
              okText: "Delete",
              okButtonProps: { danger: true },
              onOk: () => deleteAttributesMutation.mutate(selectedAttributeIds),
            });
          }}
        >
          Delete Selected
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
        rowSelection={{
          selectedRowKeys: selectedAttributeIds,
          onChange: setSelectedAttributeIds,
        }}
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

          {selectedType === "SELECT" && (
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <div>
                  <Text strong>Dropdown Options</Text>

                  {fields.map((field) => (
                    <Space
                      key={field.key}
                      style={{ display: "flex", marginTop: 8 }}
                      align="baseline"
                    >
                      <Form.Item
                        {...field}
                        name={[field.name, "value"]}
                        rules={[
                          {
                            required: true,
                            message: "Option value is required",
                          },
                        ]}
                      >
                        <Input placeholder="Example: Advanced" />
                      </Form.Item>

                      <Button danger onClick={() => remove(field.name)}>
                        Remove
                      </Button>
                    </Space>
                  ))}

                  <Button style={{ marginTop: 8 }} onClick={() => add()}>
                    Add Option
                  </Button>
                </div>
              )}
            </Form.List>
          )}

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

      <Modal
        title="Edit Attribute"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (!selectedAttribute) return;

            updateAttributeMutation.mutate({
              id: selectedAttribute.id,
              values,
            });
          }}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Attribute name is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: "Category is required" }]}
          >
            <Select options={categoryOptions} />
          </Form.Item>

          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: "Type is required" }]}
          >
            <Select options={typeOptions} />
          </Form.Item>

          {selectedEditType === "SELECT" && (
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <div>
                  <Text strong>Dropdown Options</Text>

                  {fields.map((field) => (
                    <Space
                      key={field.key}
                      style={{ display: "flex", marginTop: 8 }}
                      align="baseline"
                    >
                      <Form.Item
                        {...field}
                        name={[field.name, "value"]}
                        rules={[
                          {
                            required: true,
                            message: "Option value is required",
                          },
                        ]}
                      >
                        <Input placeholder="Example: Lead" />
                      </Form.Item>

                      <Button danger onClick={() => remove(field.name)}>
                        Remove
                      </Button>
                    </Space>
                  ))}

                  <Button style={{ marginTop: 8 }} onClick={() => add()}>
                    Add Option
                  </Button>
                </div>
              )}
            </Form.List>
          )}

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="version" hidden>
            <Input />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={updateAttributeMutation.isPending}
          >
            Save Changes
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
