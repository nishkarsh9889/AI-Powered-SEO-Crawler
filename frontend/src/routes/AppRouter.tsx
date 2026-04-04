import { BrowserRouter, Routes, Route } from "react-router-dom";
import CreateDomain from "../pages/CreateDomain";
import GetYourPages from "../pages/GetYourPages";
import EnqueueUrl from "../pages/EnqueueUrl";
import PageDetail from "../pages/PageDetail";
import AiSummary from "../pages/AiSummary";
import CreateNode from "../pages/createNode";
import NodeDetails from "../pages/nodeDetails";
import Landing from "../pages/LandingPage";
import NodeInsights from "../pages/NodeInsights";

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/createDomain" element={<CreateDomain />} />
                <Route path="/getYourPages" element={<GetYourPages />} />
                <Route path="/EnqueueUrl" element={<EnqueueUrl />} />
                <Route path="/pageDetail/:pageId" element={<PageDetail />} />
                <Route path="/AiSummary/:id" element={<AiSummary />} />
                <Route path="/createNode/" element={<CreateNode />} />
                <Route path="/nodeDetails/:nodeId" element={<NodeDetails />} />
                <Route path="/nodeInsights/:nodeId" element={<NodeInsights />} />
                <Route path="/" element={<Landing />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;