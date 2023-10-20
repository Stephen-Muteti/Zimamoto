import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import Analytics from '@mui/icons-material/AutoGraphOutlined';
import HelpCenterIcon from '@mui/icons-material/HelpCenterOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccountsOutlined';
import ManageBrigadesIcon from '@mui/icons-material/DirectionsBusFilledOutlined';
import {NavLink} from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';


const AdminSidebar = () => {
	return(
		<div className="vertical-menu admin-sidebar">
			<SimpleBar data-simplebar className="sidebar-menu-scroll admin-menu-scroll">
	            <div id="sidebar-menu">
	                <ul className="metismenu list-unstyled" id="side-menu">
	                    {/*<li className="menu-title" data-key="t-dashboards">Dashboards</li>*/}
	                    <li>
                            <NavLink to="" end>
                                <i className="icon nav-icon admin-sidebar-links"><DashboardIcon/></i>
                                <span className="menu-item" data-key="t-sales">Dashboard</span>
                                <span className="badge rounded-pill badge-soft-secondary"></span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="manage-users">
                                <i className="icon nav-icon admin-sidebar-links"><ManageAccountsIcon/></i>
                                <span className="menu-item" data-key="t-sales">User Management</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="manage-brigades">
                                <i className="icon nav-icon admin-sidebar-links"><ManageBrigadesIcon/></i>
                                <span className="menu-item" data-key="t-sales">Brigade Management</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="analytics">
                                <i className="icon nav-icon admin-sidebar-links"><Analytics/></i>
                                <span className="menu-item" data-key="t-sales">Analytics</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="user-support">
                                <i className="icon nav-icon admin-sidebar-links"><HelpCenterIcon/></i>
                                <span className="menu-item" data-key="t-sales">User Support</span>
                                <span className="badge rounded-pill badge-soft-secondary">5+</span>
                            </NavLink>
                        </li>
	                </ul>
	            </div>
	        </SimpleBar>
        </div>
		);
}

export default AdminSidebar;