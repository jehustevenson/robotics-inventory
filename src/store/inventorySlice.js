import { createSlice } from "@reduxjs/toolkit";

const initialItems = [
  { id: 1, name: "Arduino Uno R3", category: "Microcontrollers", totalQuantity: 15 },
  { id: 2, name: "Raspberry Pi 4", category: "Microcontrollers", totalQuantity: 10 },
  { id: 3, name: "Ultrasonic Sensor HC-SR04", category: "Sensors", totalQuantity: 30 },
  { id: 4, name: "IR Sensor Module", category: "Sensors", totalQuantity: 25 },
  { id: 5, name: "Temperature Sensor DHT11", category: "Sensors", totalQuantity: 20 },
  { id: 6, name: "DC Motor 12V", category: "Motors", totalQuantity: 18 },
  { id: 7, name: "Servo Motor SG90", category: "Motors", totalQuantity: 22 },
  { id: 8, name: "Stepper Motor 28BYJ-48", category: "Motors", totalQuantity: 12 },
  { id: 9, name: "LEGO Mindstorms EV3 Kit", category: "Kits", totalQuantity: 8 },
  { id: 10, name: "Arduino Starter Kit", category: "Kits", totalQuantity: 6 },
  { id: 11, name: "Robotics Sensor Pack", category: "Kits", totalQuantity: 5 },
];

const initialTransactions = [
  { id: 1, itemId: 1, itemName: "Arduino Uno R3", category: "Microcontrollers", quantity: 3, teacherName: "Ms. Sarah Johnson", borrowDate: "2026-02-28T09:15:00", returnDate: null, returned: false },
  { id: 2, itemId: 3, itemName: "Ultrasonic Sensor HC-SR04", category: "Sensors", quantity: 5, teacherName: "Mr. David Lee", borrowDate: "2026-02-27T11:30:00", returnDate: null, returned: false },
  { id: 3, itemId: 6, itemName: "DC Motor 12V", category: "Motors", quantity: 4, teacherName: "Ms. Emily Chen", borrowDate: "2026-02-26T14:00:00", returnDate: "2026-03-01T10:00:00", returned: true },
  { id: 4, itemId: 9, itemName: "LEGO Mindstorms EV3 Kit", category: "Kits", quantity: 2, teacherName: "Mr. Robert Kim", borrowDate: "2026-03-01T08:45:00", returnDate: null, returned: false },
  { id: 5, itemId: 7, itemName: "Servo Motor SG90", category: "Motors", quantity: 6, teacherName: "Ms. Patricia Wong", borrowDate: "2026-03-02T13:20:00", returnDate: null, returned: false },
  { id: 6, itemId: 4, itemName: "IR Sensor Module", category: "Sensors", quantity: 3, teacherName: "Mr. James Miller", borrowDate: "2026-03-03T10:00:00", returnDate: null, returned: false },
  { id: 7, itemId: 2, itemName: "Raspberry Pi 4", category: "Microcontrollers", quantity: 2, teacherName: "Ms. Linda Park", borrowDate: "2026-02-25T09:00:00", returnDate: "2026-02-28T15:30:00", returned: true },
];

const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    items: initialItems,
    transactions: initialTransactions,
    nextItemId: 12,
    nextTransactionId: 8,
  },
  reducers: {
    addItem: (state, action) => {
      state?.items?.push({ ...action?.payload, id: state?.nextItemId });
      state.nextItemId += 1;
    },
    updateItem: (state, action) => {
      const idx = state?.items?.findIndex(i => i?.id === action?.payload?.id);
      if (idx !== -1) state.items[idx] = action?.payload;
    },
    deleteItem: (state, action) => {
      state.items = state?.items?.filter(i => i?.id !== action?.payload);
    },
    borrowItem: (state, action) => {
      state?.transactions?.push({ ...action?.payload, id: state?.nextTransactionId });
      state.nextTransactionId += 1;
    },
    returnItem: (state, action) => {
      const idx = state?.transactions?.findIndex(t => t?.id === action?.payload);
      if (idx !== -1) {
        state.transactions[idx].returned = true;
        state.transactions[idx].returnDate = new Date()?.toISOString();
      }
    },
  },
});

export const { addItem, updateItem, deleteItem, borrowItem, returnItem } = inventorySlice?.actions;
export default inventorySlice?.reducer;