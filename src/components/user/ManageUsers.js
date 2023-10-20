import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import UsersTable from './UsersTable.js';
import UsersDataDoughnut from './UsersDataDoughnut';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import {NavLink, Outlet, useNavigate} from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
// import BrigadesTable from './BrigadesTable.js';

const ManageUsers = () => {

  return (
    <div className="container-fluid">
      <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-flex align-items-center justify-content-between">
                        <h4 className="mb-0">Manage Users</h4>
                        <div className="page-title-right">
                            <Stack direction="row" className="add-user-container">
                              <NavLink to="add-user" className="add-user-link">
                                <Button variant="outlined" startIcon={<AddOutlinedIcon />}>
                                  Add user
                                </Button>
                                </NavLink>
                            </Stack>
                        </div>
                    </div>
                    <div className="row">
                      <UsersTable/>
                      <UsersDataDoughnut/>
                    </div>
                    
                </div>
            </div>
        </div>
  );
}

export default ManageUsers;
