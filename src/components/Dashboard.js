import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import FireReports from './FireReports.js';
import FireReportsChart from './FireReportsChart.js';
import React, { useState, useEffect } from 'react';

const Dashboard = () => {   

	return(
		<div className="container-fluid">
			<div className="row">
                <div className="col-12">
                    <div className="page-title-box d-flex align-items-center justify-content-between">
                        <h4 className="mb-0">Dashboard</h4>
                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item"><a>Admin</a></li>
                                <i><ArrowForwardIosOutlinedIcon/></i>
                                <li className="breadcrumb-item active">Dashboard</li>
                            </ol>
                        </div>
                    </div>
                </div>
            <div className="row fire-reports-wrapper">
                <FireReports/>
            </div>
            <div className="row fire-reports-wrapper display-flex-center">
                <FireReportsChart/>
            </div>
            </div>
        </div>
	);
}

export default Dashboard;