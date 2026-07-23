import {
  Alert,
  Button,
  Form,
  Grid,
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
import { canManageLibrary } from "../utils/roles";
import { useI18n } from "../i18n/i18nContext";

const { Title, Text } = Typography;

const categoryValues = [
  "PERSONAL_INFORMATION",
  "CERTIFICATION",
  "DOMAIN_KNOWLEDGE",
  "SOFT_SKILLS",
  "TECHNICAL_SKILLS",
  "LANGUAGE",
  "EDUCATION",
  "EXPERIENCE",
  "OTHER",
];

const typeValues = [
  "STRING",
  "TEXT",
  "IMAGE",
  "NUMERIC",
  "DATE",
  "PERIOD",
  "BOOLEAN",
  "SELECT",
];

export function AttributeLibraryPage({ user }) {
  const { t } = useI18n();
  const screens = Grid.useBreakpoint();
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

  if (!canManageLibrary(user)) {
    return <Alert type="warning" message={t("attributeLibrary.noAccess", "You do not have access to this page")} />;
  }

  const categoryOptions = categoryValues.map((value) => ({
    label: t(`attributeCategory.${value}`, value),
    value,
  }));

  const typeOptions = typeValues.map((value) => ({
    label: t(`attributeType.${value}`, value),
    value,
  }));

  const columns = [
    {
      title: t("attributeLibrary.name", "Name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("attributeLibrary.category", "Category"),
      dataIndex: "category",
      key: "category",
      render: (category) => <Tag>{t(`attributeCategory.${category}`, category)}</Tag>,
    },
    {
      title: t("attributeLibrary.type", "Type"),
      dataIndex: "type",
      key: "type",
      render: (type) => t(`attributeType.${type}`, type),
    },
    {
      title: t("attributeLibrary.description", "Description"),
      dataIndex: "description",
      key: "description",
      render: (description) =>
        description || <Text type="secondary">{t("common.noDescription", "No description")}</Text>,
    },
    {
      title: t("attributeLibrary.options", "Options"),
      dataIndex: "options",
      key: "options",
      render: (options, record) => {
        if (record.type !== "SELECT") {
          return <Text type="secondary">{t("common.none", "—")}</Text>;
        }

        if (!options || options.length === 0) {
          return <Text type="secondary">{t("attributeLibrary.noOptions", "No options")}</Text>;
        }

        return (
          <Space wrap className="responsive-tag-list">
            {options.map((option) => (
              <Tag key={option.id}>{option.value}</Tag>
            ))}
          </Space>
        );
      },
    },
  ];

  if (isError) {
    return <Text type="danger">{t("attributeLibrary.loadError", "Failed to load attributes")}</Text>;
  }

  return (
    <div className="responsive-page">
      <div className="responsive-page__header responsive-page__header--primary-action">
        <div className="responsive-page__title-group">
          <Title level={2} className="responsive-page__title" style={{ margin: 0 }}>
            {t("attributeLibrary.title", "Attribute Library")}
          </Title>
        </div>

        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
          {t("attributeLibrary.createAttribute", "Create Attribute")}
        </Button>
      </div>

      <Space className="responsive-filter-bar" style={{ marginBottom: 16 }} wrap>
        <Input.Search
          className="responsive-filter-control"
          placeholder={t("attributeLibrary.searchPlaceholder", "Search attributes by name")}
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ width: 280 }}
        />

        <Select
          className="responsive-filter-control"
          placeholder={t("attributeLibrary.filterCategory", "Filter by category")}
          allowClear
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
          style={{ width: 220 }}
        />
      </Space>

      <div className="responsive-toolbar responsive-toolbar--actions" style={{ marginBottom: 16 }}>
        <Text className="responsive-toolbar__meta" type="secondary">
          {t("common.selected", "Selected")}: {selectedAttributeIds.length}
        </Text>

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
          {t("attributeLibrary.editSelected", "Edit Selected")}
        </Button>

        <Button
          danger
          disabled={selectedAttributeIds.length === 0}
          loading={deleteAttributesMutation.isPending}
          onClick={() => {
            Modal.confirm({
              title: t("attributeLibrary.deleteConfirmTitle", "Delete selected attributes?"),
              content:
                t(
                  "attributeLibrary.deleteConfirmBody",
                  "This action will also delete dropdown options for selected attributes.",
                ),
              okText: t("common.delete", "Delete"),
              okButtonProps: { danger: true },
              onOk: () => deleteAttributesMutation.mutate(selectedAttributeIds),
            });
          }}
        >
          {t("attributeLibrary.deleteSelected", "Delete Selected")}
        </Button>
      </div>

      <Table
        className="responsive-table"
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
        scroll={!screens.lg ? { x: 1040 } : undefined}
        rowSelection={{
          selectedRowKeys: selectedAttributeIds,
          onChange: setSelectedAttributeIds,
        }}
      />

      <Modal
        className="responsive-modal"
        title={t("attributeLibrary.createAttribute", "Create Attribute")}
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        width={screens.md ? 720 : "calc(100vw - 24px)"}
      >
        <Form
          className="responsive-form"
          form={form}
          layout="vertical"
          onFinish={(values) => createAttributeMutation.mutate(values)}
        >
          <Form.Item
            label={t("attributeLibrary.name", "Name")}
            name="name"
            rules={[{ required: true, message: t("attributeLibrary.nameRequired", "Attribute name is required") }]}
          >
            <Input placeholder={t("attributeLibrary.namePlaceholder", "Example: English Level")} />
          </Form.Item>

          <Form.Item
            label={t("attributeLibrary.category", "Category")}
            name="category"
            rules={[{ required: true, message: t("attributeLibrary.categoryRequired", "Category is required") }]}
          >
            <Select placeholder={t("attributeLibrary.categoryPlaceholder", "Select category")} options={categoryOptions} />
          </Form.Item>

          <Form.Item
            label={t("attributeLibrary.type", "Type")}
            name="type"
            rules={[{ required: true, message: t("attributeLibrary.typeRequired", "Type is required") }]}
          >
            <Select placeholder={t("attributeLibrary.typePlaceholder", "Select type")} options={typeOptions} />
          </Form.Item>

          {selectedType === "SELECT" && (
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <div>
                  <Text strong>{t("attributeLibrary.dropdownOptions", "Dropdown Options")}</Text>

                  {fields.map((field) => (
                    <Space
                      wrap
                      className="responsive-inline-field"
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
                            message: t("attributeLibrary.optionRequired", "Option value is required"),
                          },
                        ]}
                      >
                        <Input placeholder={t("attributeLibrary.optionPlaceholderAdvanced", "Example: Advanced")} />
                      </Form.Item>

                      <Button danger onClick={() => remove(field.name)}>
                        {t("attributeLibrary.removeOption", "Remove")}
                      </Button>
                    </Space>
                  ))}

                  <Button style={{ marginTop: 8 }} onClick={() => add()}>
                    {t("attributeLibrary.addOption", "Add Option")}
                  </Button>
                </div>
              )}
            </Form.List>
          )}

          <Form.Item label={t("attributeLibrary.description", "Description")} name="description">
            <Input.TextArea
              rows={3}
              placeholder={t("attributeLibrary.descriptionPlaceholder", "Short explanation for recruiters and candidates")}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={createAttributeMutation.isPending}
          >
            {t("attributeLibrary.saveAttribute", "Save Attribute")}
          </Button>
        </Form>
      </Modal>

      <Modal
        className="responsive-modal"
        title={t("attributeLibrary.editAttribute", "Edit Attribute")}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={screens.md ? 720 : "calc(100vw - 24px)"}
      >
        <Form
          className="responsive-form"
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
            label={t("attributeLibrary.name", "Name")}
            name="name"
            rules={[{ required: true, message: t("attributeLibrary.nameRequired", "Attribute name is required") }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t("attributeLibrary.category", "Category")}
            name="category"
            rules={[{ required: true, message: t("attributeLibrary.categoryRequired", "Category is required") }]}
          >
            <Select options={categoryOptions} />
          </Form.Item>

          <Form.Item
            label={t("attributeLibrary.type", "Type")}
            name="type"
            rules={[{ required: true, message: t("attributeLibrary.typeRequired", "Type is required") }]}
          >
            <Select options={typeOptions} />
          </Form.Item>

          {selectedEditType === "SELECT" && (
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <div>
                  <Text strong>{t("attributeLibrary.dropdownOptions", "Dropdown Options")}</Text>

                  {fields.map((field) => (
                    <Space
                      wrap
                      className="responsive-inline-field"
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
                            message: t("attributeLibrary.optionRequired", "Option value is required"),
                          },
                        ]}
                      >
                        <Input placeholder={t("attributeLibrary.optionPlaceholderLead", "Example: Lead")} />
                      </Form.Item>

                      <Button danger onClick={() => remove(field.name)}>
                        {t("attributeLibrary.removeOption", "Remove")}
                      </Button>
                    </Space>
                  ))}

                  <Button style={{ marginTop: 8 }} onClick={() => add()}>
                    {t("attributeLibrary.addOption", "Add Option")}
                  </Button>
                </div>
              )}
            </Form.List>
          )}

          <Form.Item label={t("attributeLibrary.description", "Description")} name="description">
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
            {t("attributeLibrary.saveChanges", "Save Changes")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
