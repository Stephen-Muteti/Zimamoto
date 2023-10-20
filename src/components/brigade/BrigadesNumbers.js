import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import DoNotDisturbOnTotalSilenceOutlinedIcon from '@mui/icons-material/DoNotDisturbOnTotalSilenceOutlined';
import OnlinePredictionOutlinedIcon from '@mui/icons-material/OnlinePredictionOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import AccessibilityNewOutlinedIcon from '@mui/icons-material/AccessibilityNewOutlined';
import NotAccessibleOutlinedIcon from '@mui/icons-material/NotAccessibleOutlined';
import socketIOClient from 'socket.io-client';

const BrigadeNumbers = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetchError, setDataFetchError] = useState(false);
  const [brigadeCategories, setBrigadeCategories] = useState(null);
  const [message, setMessage] = useState('');  


  const fetchBrigadeCategories = async () => {
    try {      
      const authToken = localStorage.getItem("access_token");

      const response = await axios.get('https://zimamoto-deab7f8718a9.herokuapp.com/get_brigade_categories',
          {
            headers: {Authorization: `Bearer ${authToken}`,},
          }
        );
      if (response.status === 200) {
        const userCategoryData = response.data;
        setBrigadeCategories(userCategoryData);
      }
    } catch (error) {
      handleRequestError(error);
    }finally{
      setIsLoading(false);      
    }
  };


  const handleRequestError = (error) => {
    setDataFetchError(true);
    let message = 'An error occurred while processing your request';
    if (error.response) {
      message = `Error ${error.response.status} : ${error.response.data.error}`;
    } else if (error.request) {
      message = 'Server is unreachable. Try again later';
    }
    setMessage(message);
  };


  useEffect(() => {
    fetchBrigadeCategories();
    const newSocket = socketIOClient('https://zimamoto-deab7f8718a9.herokuapp.com');
    newSocket.on('connect', () => {
      console.log('WebSocket connected!');
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected!');
    });

    newSocket.on('brigade_availability_update', ({ operatorEmail, availability }) => {
      fetchBrigadeCategories();
    });


    newSocket.on('brigade_state_update', (updateData) => {
      if (updateData) {
        fetchBrigadeCategories();
        // setBrigadeCategories((prevCategories) => ({
        //   ...prevCategories,
        //   active: Math.min(Math.max(parseInt(prevCategories.active) + parseInt(updateData.activeChange), 0), prevCategories.total),
        //       inactive: Math.min(Math.max(parseInt(prevCategories.inactive) + parseInt(updateData.inactiveChange), 0), prevCategories.total),
            
        // }));
      }
    });
    
    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <div className="col-xl-4">
      <div className="card card-h-100">
        <div className="card-body">
          <div className="d-flex justify-content-between">
            <h4 className="card-title mb-4">Brigade Number Analysis</h4>
          </div>

          {isLoading ? (
            <div className="text-center">
              <CircularProgress color="primary" />
            </div>
          ) : dataFetchError ? (
            <div className="text-center text-danger">
              {message}
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-muted mt-4">Total Brigades : {brigadeCategories ? brigadeCategories.total : '-'}</p>
              </div>

              <div className="mt-4 brigade-numbers-card-container">
                <BrigadesCard
                  title={'Active'}
                  value={brigadeCategories ? brigadeCategories.active : '-'}
                  icon={<OnlinePredictionOutlinedIcon />}
                />

                <BrigadesCard
                  title={'Inactive'}
                  value={brigadeCategories ? brigadeCategories.inactive : '-'}
                  icon={<NotAccessibleOutlinedIcon />}
                />                
              </div>

              <div className="mt-4 brigade-numbers-card-container">
                <BrigadesCard
                  title={'Engaged'}
                  value={brigadeCategories ? brigadeCategories.engaged : '-'}
                  icon={<DoNotDisturbOnTotalSilenceOutlinedIcon />}
                />

                <BrigadesCard
                  title={'Free'}
                  value={brigadeCategories ? brigadeCategories.free : '-'}
                  icon ={<AccessibilityNewOutlinedIcon />}
                />

                <BrigadesCard
                  title={'Under Maintenance'}
                  value={brigadeCategories ? brigadeCategories.maintenance : '-'}
                  icon={<EngineeringOutlinedIcon />}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BrigadeNumbers;

export const BrigadesCard = ({ title, value, icon }) => {
  return (
    <div className="card border shadow-none mb-2 brigade-numbers-card">
      <div href="javascript: void(0);" className="text-body">
        <div className="p-2">
          <div className="d-flex">
            <div className="avatar-sm align-self-center me-2">
              <div className="avatar-title rounded bg-transparent text-success font-size-18">
                {icon}
              </div>
            </div>

            <div className="overflow-hidden me-auto">
              <h5 className="font-size-13 text-truncate mb-1">{title}</h5>
              <p className="text-muted text-truncate mb-0">{value} Brigades</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
