import {NavLink, Outlet} from 'react-router-dom';
import HomeOutlinedIcon from '@mui/icons-material/Home';
import InfoOutlinedIcon from '@mui/icons-material/Info';
import BarChartOutlinedIcon from '@mui/icons-material/BarChart';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';

const Header = () => {
	return(
        <>
		<header id="page-topbar">
	        <div className="navbar-header row">
                <div className="col-xl-6 navbar-brand-box brand-box-for-user">
                    <NavLink to="/" className="logo app-name-link logo-dark">
                        <span className="app-name">
                            ZimaMoto
                        </span>
                    </NavLink>
                </div>
	        	<ul className="col-xl-4 nav nav-tabs nav-tabs-custom navbar home-navbar" role="tablist">
                
                    <li className="nav-item">
                        <NavLink className="nav-link" data-bs-toggle="tab" role="tab" to="/" end>
                            <span className="d-block d-sm-none"><i><HomeOutlinedIcon/></i></span>
                            <span className="d-none d-sm-block">Home</span> 
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link" data-bs-toggle="tab" role="tab" to="stats">
                            <span className="d-block d-sm-none"><i><BarChartOutlinedIcon/></i></span>
                            <span className="d-none d-sm-block">Stats</span>    
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link" data-bs-toggle="tab" role="tab" to="about-us">
                            <span className="d-block d-sm-none"><i><InfoOutlinedIcon/></i></span>
                            <span className="d-none d-sm-block">About Us</span> 
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link" data-bs-toggle="tab" role="tab" to="contact-us">
                            <span className="d-block d-sm-none"><i><ContactSupportIcon/></i></span>
                            <span className="d-none d-sm-block">Contact</span>   
                        </NavLink>
                    </li>
                </ul>
	        </div>
      	</header>            
        </>
		);
}

export default Header;