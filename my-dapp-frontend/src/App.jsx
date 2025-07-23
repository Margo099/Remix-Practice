import DonationForm from "./DonationForm";
import DonationList from "./DonationList";
import { useState } from "react";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewDonation = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <h1>🌟 Donation DApp</h1>
      <DonationForm onDonation={handleNewDonation} />
      <DonationList key={refreshKey} />
    </div>
  );
}

export default App;