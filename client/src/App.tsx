import MyTickets from "./screens/MyTickets";

export default function App() {
  return (
    <MyTickets
      onCreateTicket={() => {
        window.location.href = "/create-ticket";
      }}
      onChangeRequester={() => {
        window.location.href = "/requester-selection";
      }}
      onOpenTicket={(ticketNumber) => {
        window.location.href = `/tickets/${encodeURIComponent(ticketNumber)}`;
      }}
    />
  );
}
