import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import {NavLink,useNavigate} from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import BrigadesTable from './BrigadesTable.js';
import BrigadesStatusCategoryChart from './BrigadesStatusCategoryChart.js';
import BrigadesAvailabilityCategoryChart from './BrigadesAvailabilityCategoryChart.js';
import BrigadeNumbers from './BrigadesNumbers.js';

const ManageBrigades = () => {

  return (
    <div className="container-fluid">
      <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-flex align-items-center justify-content-between">
                        <h4 className="mb-0">Manage Brigades</h4>
                        <div className="page-title-right">
                            <Stack direction="row" className="add-user-container">
                              <NavLink to="add-brigade" className="add-user-link">
                                <Button variant="outlined" startIcon={<AddOutlinedIcon />}>
                                  Add brigade
                                </Button>
                                </NavLink>
                            </Stack>
                        </div>
                    </div>
                    <div className="row">
                      <BrigadeNumbers/>
                      <BrigadesStatusCategoryChart/>
                      <BrigadesAvailabilityCategoryChart/>                      
                    </div>
                    <div className="row">
                      <BrigadesTable/>
                    </div>                                       
                </div>
            </div>
        </div>
  );
}

export default ManageBrigades;
