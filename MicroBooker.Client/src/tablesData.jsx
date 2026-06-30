import { MdTableRestaurant } from "react-icons/md";
import { nanoid } from "nanoid";

const restaurantTables = [
  {
    id: nanoid(),
    tableNumber: "table_number_1",
    capacity: 2,
    icon: <MdTableRestaurant />,
  },
  {
    id: nanoid(),
    tableNumber: "table_number_2",
    capacity: 2,
    icon: <MdTableRestaurant />,
  },
  {
    id: nanoid(),
    tableNumber: "table_number_3",
    capacity: 4,
    icon: <MdTableRestaurant />,
  },
  {
    id: nanoid(),
    tableNumber: "table_number_4",
    capacity: 4,
    icon: <MdTableRestaurant />,
  },
  {
    id: nanoid(),
    tableNumber: "table_number_5",
    capacity: 6,
    icon: <MdTableRestaurant />,
  },
  {
    id: nanoid(),
    tableNumber: "table_number_6",
    capacity: 6,
    icon: <MdTableRestaurant />,
  },
  {
    id: nanoid(),
    tableNumber: "table_number_7",
    capacity: 8,
    icon: <MdTableRestaurant />,
  },
  {
    id: nanoid(),
    tableNumber: "table_number_8",
    capacity: 8,
    icon: <MdTableRestaurant />,
  },
];

const timeSlots = [
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
];

const generateSidebarDates = (daysCount = 7) => {
  const days = [];
  const today = new Date();

  for (let i = 0; i < daysCount; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);

    days.push({
      id: nanoid(),
      date: currentDate.toISOString().split("T")[0],
      dayOfWeek: currentDate.toLocaleDateString("en-US", {
        weekday: "long",
      }),
      dayLabel: currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      times: timeSlots,
    });
  }

  return days;
};

export const sidebarDates = generateSidebarDates();

export default restaurantTables;
