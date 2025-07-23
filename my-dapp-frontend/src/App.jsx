import DonationForm from "./DonationForm";
import DonationList from "./DonationList";
import { useState } from "react";

const appStyles = {
  maxWidth: 800,
  margin: "2rem auto",
  padding: "1rem",
  fontFamily: "Arial, sans-serif",
  color: "#333",
};

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewDonation = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div style={appStyles}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>🌟 Donation DApp</h1>
      <DonationForm onDonation={handleNewDonation} />
      <DonationList key={refreshKey} />
    </div>
  );
}

export default App;
