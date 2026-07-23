import { useQuery } from "@tanstack/react-query";
import { getPositionCounts } from "../api/positionApi";

const PositionCount = () => {
  const data = useQuery({
    queryKey: ["position-counts"],
    queryFn: getPositionCounts,
  });

  const count = data?.data?.count ?? 0;
  return <div>Total positions: {count}</div>;
};

export default PositionCount;
