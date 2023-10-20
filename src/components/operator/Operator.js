import { Helmet } from 'react-helmet';
import React, { useState, useEffect } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import socketIOClient from 'socket.io-client';
import AssignedTasks from './AssignedTasksTable.js';
import {AvailabilityCard, LocationCard, ResponseCard } from './AvailabilityLocationCards.js';
import {useAuth} from '../auth.js';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { Footer } from '../Footer.js';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});


const Operator = () => {
	const auth = useAuth();
  	const [showSnackBar, setShowSnackBar] = useState(false);
  	const [snackBarSeverity, setSnackBarSeverity] = useState('success');
  	const [snackBarMessage, setSnackBarMessage] = useState('User Deleted Successfully');

  	const handleCloseSnackBar = (event, reason) => {
      if (reason === 'clickaway') {
        return;
      }

      setShowSnackBar(false);
    };


	useEffect(() => {
	    const socket = socketIOClient('https://zimamoto-deab7f8718a9.herokuapp.com');

	    socket.on('connect', () => {
		  	updateOperatorStatus('active');

	    });

	    socket.on('disconnect', () => {
		  updateOperatorStatus('inactive');
		});
	    
	    return () => {
	      socket.close();
	    };
	  }, []);

	  const updateOperatorStatus = async (status) => {
		  try {
		    const authToken = localStorage.getItem("access_token");
		    const response = await fetch('https://zimamoto-deab7f8718a9.herokuapp.com/update_operator_status', {
		      method: 'PUT',
		      headers: {
		        'Content-Type': 'application/json',
		        Authorization: `Bearer ${authToken}`,
		      },
		      body: JSON.stringify({ status }),
		    });

		    if (response.ok) {
		      
		    } else {
		      
		    }
		    } catch (error) {
		    
		  }
		};


		// Define handleVisibilityChange and handleBeforeUnload functions
  const handleVisibilityChange = () => {
    if (document.hidden) {
      updateOperatorStatus('inactive');
    } else {
      updateOperatorStatus('active');
    }
  };

  const handleBeforeUnload = () => {
    updateOperatorStatus('inactive');
  };

  useEffect(() => {
    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

	return (
		<>
		    <Helmet>
		      <title>ZimaMoto | Operator</title>
		    </Helmet>
		    <div className="main-content user-main-container">
		      <SimpleBar className="page-content page-container-scroll">
		             <div className="container-fluid">
						<div className="row">
			                <div className="">
			                    <div className="page-title-box d-flex align-items-center justify-content-between">
			                        <h4 className="mb-0">Operator</h4>
			                    </div>
			                </div>
			            <div className="row">
			            	<ResponseCard/>
			            	<AvailabilityCard
	            			  showSnackBar={showSnackBar}
						      setShowSnackBar={setShowSnackBar}
						      snackBarSeverity={snackBarSeverity}
						      setSnackBarSeverity={setSnackBarSeverity}
						      snackBarMessage={snackBarMessage}
						      setSnackBarMessage={setSnackBarMessage}
			            	/>
			            	<LocationCard/>
			            </div>
			            <div className="row">
			                <AssignedTasks/>		                
			            </div>
			            </div>
			        </div> 

              <Footer/>

		      </SimpleBar>

		      {showSnackBar && (
                  <Snackbar open={showSnackBar} autoHideDuration={3000} onClose={handleCloseSnackBar}>
                    <Alert onClose={handleCloseSnackBar} severity={snackBarSeverity} sx={{ width: '100%' }}>
                      {snackBarMessage}
                    </Alert>
                  </Snackbar>
                )}
		    </div>
	    </>
		);
}

export default Operator;