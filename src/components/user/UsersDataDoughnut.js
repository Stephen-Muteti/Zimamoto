import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import socketIOClient from 'socket.io-client';


ChartJS.register(ArcElement, Tooltip, Legend);

const UsersDataDoughnut = () => {
  const [data, setData] = useState({
    labels: ['Administrators', 'Staff', 'Operators'],
    datasets: [
      {
        label: 'Number ',
        data: [],
            backgroundColor: [
                'rgba(169, 169, 169, 0.5)',
                'rgba(128, 128, 128, 0.5)',
                'rgba(192, 192, 192, 0.5)',
                ],
                borderColor: [
                'rgba(169, 169, 169, 0.2)',
                'rgba(128, 128, 128, 0.2)',
                'rgba(192, 192, 192, 0.2)',
                ],
        borderWidth: 1,
      },
    ],
  });

  const [isLoading, setIsLoading] = useState(true); // Initially, set loading to true
  const [dataFetchError, setDataFetchError] = useState(false);
  const fetchData = () => {
    const authToken = localStorage.getItem("access_token");

    axios.get('https://zimamoto-deab7f8718a9.herokuapp.com/get_user_category_data',
        {
          headers: {Authorization: `Bearer ${authToken}`,},
        }
      )
      .then(response => {
        if(response.status === 200){
          if (response.data.error) {
            setDataFetchError(true);
            setIsLoading(false);
          }else{
            const userCategoryData = response.data;
            setData(prevData => ({
              ...prevData,
              datasets: [{
                ...prevData.datasets[0],
                data: [userCategoryData.administrators, userCategoryData.staff, userCategoryData.operators]
              }]
            }));
            setIsLoading(false);
          }          
        }
        else {
          setDataFetchError(true);
          setIsLoading(false);
        }
      })
      .catch(error => {
        console.error('Error fetching user category data:', error);
        setIsLoading(false); // An error occurred, set loading to false
        setDataFetchError(true);
      });
  }

  useEffect(() => {
    fetchData();
  }, []);


  useEffect(() => {
      const newSocket = socketIOClient('https://zimamoto-deab7f8718a9.herokuapp.com');

      newSocket.on('update_users', (newData) => {
        fetchData();
      });

      
      return () => {
        newSocket.close();
      };
    }, []);


  return (
    <div className="col-xl-4">
      <div className="card card-h-100 user-doughnut-card">
        <div className="card-body">
          <div className="d-flex justify-content-between">
            <h4 className="card-title mb-4">Users by category</h4>
          </div>
          {isLoading ? (
            <div className="text-center">
              <CircularProgress color="primary" />
            </div>
          ) : dataFetchError ? (
            <div className="text-center text-danger">
              Error fetching data. Please try again later.
            </div>
          ) : (
            <Doughnut data={data} />
          )}
        </div>
      </div>
    </div>
  );
}

export default UsersDataDoughnut;
