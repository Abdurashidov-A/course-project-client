import { Card, Space, Typography } from "antd";

const { Title, Text } = Typography;

export default function PagePlaceholder({ title, description }) {
  return (
    <Card>
      <Space direction="vertical" size="small">
        <Title level={3}>{title}</Title>
        <Text type="secondary">{description}</Text>
      </Space>
    </Card>
  );
}
