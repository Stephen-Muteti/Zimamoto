import { CustomDropDown } from '../CustomCategorySelection.js';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import IconButton from '@mui/material/IconButton';
import PlaceIcon from '@mui/icons-material/PlaceOutlined';
import socketIOClient from 'socket.io-client';

export const AvailabilityCard = ({
  showSnackBar,
  setShowSnackBar,
  snackBarSeverity,
  setSnackBarSeverity,
  snackBarMessage,
  setSnackBarMessage,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('');

  const time_categories = [
    { display: 'Free', value: 'free' },
    { display: 'Engaged', value: 'engaged' },
    { display: 'Under Maintenance', value: 'under maintenance' },
  ];

  const handleCategoryChange = (selectedValue) => {
    setSelectedCategory(selectedValue);
  };

  const updateAvailability = async () => {
    try {
      const authToken = localStorage.getItem("access_token");

      const response = await axios.post('https://zimamoto-deab7f8718a9.herokuapp.com//update_availability', { availability: selectedCategory },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.status === 200) {
        setSnackBarSeverity('success');
        setSnackBarMessage(response.data.message);
      }
    }
    catch (error) {
      handleRequestError(error);
    } finally {
      setShowSnackBar(true);
    }
  };

  const handleRequestError = (error) => {
    let message = 'An error occurred while processing your request.';
    let severity = 'error';

    if (error.response) {
      const { status, data } = error.response;
      message = `Error ${status} : ${data.error}`;
    } else if (error.request) {
      message = 'Server is unreachable. Try again later';
    }

    setSnackBarSeverity(severity);
    setSnackBarMessage(message);
  };

  const fetchInitialAvailability = async () => {
    try {
      const authToken = localStorage.getItem("access_token");
      const response = await axios.get('https://zimamoto-deab7f8718a9.herokuapp.com//get_operator_availability', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.status === 200) {
        setSelectedCategory(response.data.availability);
      } else {
        setSelectedCategory('free');
      }
    } catch (error) {
      setSelectedCategory('free');
    }
  };

  useEffect(() => {
    fetchInitialAvailability();
  }, []);


  


  console.log(selectedCategory);

  useEffect(() => {
    if (selectedCategory !== '') {
      updateAvailability();
    }
  }, [selectedCategory]);

  return (
    <div className="col-xl-4">
      <div className="card">
        <div className="card-header justify-content-between d-flex align-items-center">
          <h4 className="card-title">Your Availability</h4> </div>
        <div className="card-body">
          <div className="row">
            <div className="col-xl-8 search-users-select-cat-container">
              {selectedCategory !== '' &&(<CustomDropDown
                options={time_categories}
                onCategoryChange={handleCategoryChange}
                selectedParentValue={selectedCategory}
                title={'Your Availability'}
              />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



const LOCATION_UPDATE_INTERVAL = 5000;
const COORDINATE_CHANGE_THRESHOLD = 0.001;

const LocationStatus = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
};

export const LocationCard = () => {
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCoordinates, setLocationCoordinates] = useState(null);
  const [locationStatus, setLocationStatus] = useState(LocationStatus.LOADING);



  useEffect(() => {
    if (locationAddress && locationCoordinates) {
      const authToken = localStorage.getItem("access_token");      
      axios.post('https://zimamoto-deab7f8718a9.herokuapp.com/updateLocation', { address: locationAddress, coordinates: locationCoordinates },
      {
        headers: {Authorization: `Bearer ${authToken}`,},
      }
        )
        .then(response => {
          console.log('Location data stored successfully', response.data);
        })
        .catch(error => {
          console.error('Error storing location data:', error);
        });
    }
  }, [locationAddress, locationCoordinates]);



  useEffect(() => {
    let lastCoordinates = null;

    const apiKey = 'cf2f14b5f24649798d81d0f437cdbebc';

    const getLocation = async () => {
      // setLocationStatus(LocationStatus.LOADING);

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });

          const { latitude, longitude } = position.coords;
          setLocationCoordinates({ latitude, longitude });

          
          if (
            !lastCoordinates ||
            Math.abs(latitude - lastCoordinates.latitude) >= COORDINATE_CHANGE_THRESHOLD ||
            Math.abs(longitude - lastCoordinates.longitude) >= COORDINATE_CHANGE_THRESHOLD
          ) {
            
            lastCoordinates = { latitude, longitude };

            
            const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`;

            
            const response = await fetch(apiUrl);
            const data = await response.json();

            
            const formattedAddress = data.results[0].formatted;
            setLocationAddress(formattedAddress);
            setLocationStatus(LocationStatus.READY);
          } else {
            setLocationStatus(LocationStatus.READY);
          }
        } catch (error) {
          console.error('Error getting geolocation:', error);
          setLocationStatus(LocationStatus.ERROR);
        }
      } else {
        setLocationStatus(LocationStatus.ERROR);
      }
    };

    const locationUpdateInterval = setInterval(getLocation, LOCATION_UPDATE_INTERVAL);

    
    return () => {
      clearInterval(locationUpdateInterval);
    };

    
    getLocation();
  }, []);

  return (
    <div className="col-xl-4">
      <div className="card">
        <div className="card-header justify-content-between d-flex align-items-center">
          <h4 className="card-title">Your Location</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-xl-6 search-users-select-cat-container">
              {locationStatus === LocationStatus.LOADING && 'Loading...'}
              {locationStatus === LocationStatus.READY && locationAddress}
              {locationStatus === LocationStatus.ERROR && 'Error obtaining location'}
            </div>
            <div className="col-xl-6 search-users-select-cat-container">
              {locationStatus === LocationStatus.READY && `Lat: ${locationCoordinates.latitude}, Lng: ${locationCoordinates.longitude}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




export const ResponseCard = () => {
  const [notified, setNotified] = useState(false);
  const [fireCoordinates, setFireCoordinates] = useState('');
  const [fireAddress, setFireAddress] = useState('');
  const [fireID, setFireID] = useState(null);
  const [fireStatus, setFireStatus] = useState('active');

  const handleAccept = async () => {
    try {
      const authToken = localStorage.getItem('access_token');
      const response = await fetch('https://zimamoto-deab7f8718a9.herokuapp.com/update_fire_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ FireID: fireID, newStatus: 'responding' }),
      });

      if (response.ok) {
        setFireStatus('responding');
      }
    } catch (error) {
      console.error('Error accepting the task:', error);
    }
  };

  const handleDone = async () => {
    try {
      const authToken = localStorage.getItem('access_token');
      const response = await fetch('https://zimamoto-deab7f8718a9.herokuapp.com/update_fire_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ FireID: fireID, newStatus: 'extinguished' }),
      });

      if (response.ok) {
      setFireStatus('extinguished');
      setNotified(false);
    } else {
      console.error('Failed to update the fire status.');
    }
  } catch (error) {
    console.error('Error sending the request:', error);
  }
  };

  useEffect(() => {
    const fetchPendingTasks = async () => {
      try {
        const authToken = localStorage.getItem('access_token');
        const response = await fetch('https://zimamoto-deab7f8718a9.herokuapp.com/fetch_pending_tasks', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });
        const responseData = await response.json();

        const hasPendingTasks = responseData && (responseData.FireStatus === 'active' || responseData.FireStatus === 'responding');

        setNotified(hasPendingTasks);
        setFireStatus(responseData.FireStatus);
        setFireID(responseData.FireID);
        setFireCoordinates(`Lat: ${responseData.ObtainedLatitude.toFixed(3)}, Lng: ${responseData.ObtainedLongitude.toFixed(3)}`);
        setFireAddress(responseData.LocationAddress);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchPendingTasks();
  }, []);

  useEffect(() => {
    const socket = socketIOClient('https://zimamoto-deab7f8718a9.herokuapp.com');

    socket.on('fire_assignment', ({ operator_email, location_coordinates, location_address, last_inserted_id }) => {
      const user = localStorage.getItem('user');
      const user_email = user ? JSON.parse(user).email : null;
      if (operator_email.trim() === user_email.trim()) {
        setNotified(true);
        setFireCoordinates(location_coordinates);
        setFireAddress(location_address);
        setFireStatus("active");
        setFireID(last_inserted_id);
      }
    });

    return () => {
      socket.close();
    };
  }, []);

  const showIncidentOnMap = () => {
    // Implement how to show the incident on the map
  };

  return (
    <div className="col-xl-4">
      <div className="card">
        <div className="card-header justify-content-between d-flex align-items-center">
          <h4 className="card-title">Important</h4>
        </div>
        <div className="card-body">
          <div className="row">
            {fireStatus === 'responding' ? (
              <div className="row">
                <div className="row">
                  <div className="col-xl-12 search-users-select-cat-container response-div-title">
                    Responding to the following fire incident
                  </div>
                </div>
                <div className="col-xl-6 search-users-select-cat-container">
                  {fireAddress}
                </div>
                <div className="col-xl-6 search-users-select-cat-container">
                  {fireCoordinates}
                </div>
                <div className="row align-right">
                  <div className="col-xl-4 load-more-container">
                    <IconButton aria-label="edit" size="small" onClick={showIncidentOnMap}>
                      <PlaceIcon fontSize="small" />
                    </IconButton>
                  </div>
                  <div className="col-xl-4 load-more-container">
                    <button type="submit" className="btn btn-primary w-md" onClick={handleDone}>
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ) : notified ? (
              <div className="row">
                <div className="row">
                  <div className="col-xl-12 search-users-select-cat-container response-div-title">
                    A fire incident at the location below requires your attention immediately
                  </div>
                </div>
                <div className="col-xl-6 search-users-select-cat-container">
                  {fireAddress}
                </div>
                <div className="col-xl-6 search-users-select-cat-container">
                  {fireCoordinates}
                </div>
                <div className="row align-right">
                  <div className="col-xl-4 load-more-container">
                    <IconButton aria-label="edit" size="small" onClick={showIncidentOnMap}>
                      <PlaceIcon fontSize="small" />
                    </IconButton>
                  </div>
                  {fireStatus === 'active' && (
                    <>
                      <div className="col-xl-4 load-more-container">
                        <button type="submit" className="btn btn-primary w-md" onClick={handleAccept}>
                          Accept
                        </button>
                      </div>
                      <div className="col-xl-4 load-more-container">
                        <button type="submit" className="btn btn-primary w-md">
                          Reassign
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              'Nothing at the moment'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseCard;
