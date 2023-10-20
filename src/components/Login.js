import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import SimpleBar from 'simplebar-react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Stack from '@mui/material/Stack';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth.js';

const Login = () => {
  // State variables
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [submissionError, setSubmissionError] = useState(false);

  // React Router hooks
  const navigate = useNavigate();
  // const location = useLocation();
  // const redirectPath = location.state?.path || '/';

  // Auth context
  const auth = useAuth();

  // Event handlers
  const handleClickShowPassword = () => setShowPassword((show) => !show);

	  const handleMouseDownPassword = (event) => {
	    event.preventDefault();
	  };

	  const handleInputChange = (event) => {
	    const { name, value } = event.target;
	    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
	  };

	const handleSubmit = async (event) => {
	    event.preventDefault();

	    // Validate the form data before submission
	    const isValid = validateForm();

	    if (!isValid) {
	      return;
	    }

	    setShowProgressBar(true);
	    setShowSuccessMessage(false);
	    setSubmissionError(false);

	    await submitFormData(formData);

	    // Show the success message when the submission is successful
	    setShowSuccessMessage(true);
	  };

	  const submitFormData = async (data) => {
		  try {
		    const response = await axios.post('https://zimamoto-deab7f8718a9.herokuapp.com/login', formData);

		    if (response.data.user) {
		      const user = response.data.user;

		      localStorage.setItem('user', JSON.stringify(user));
		      localStorage.setItem('access_token', response.data.token);

		      auth.login(response.data.user);

		      if (user.role === 'administrator' || user.role === 'staff') {
		        navigate('/admin', { replace: true });
		      } else if (user.role === 'operator') {
		        navigate('/operator', { replace: true });
		      }
		    }
		  } catch (error) {
		    handleRequestError(error);
		  } finally {
		    setShowProgressBar(false);
		  }
		};


	const handleRequestError = (error) => {
    if (error.response) {
      setSubmissionError(true);
      setMessage(`Error ${error.response.status} : ${error.response.data.error}`);
    } else if (error.request) {
      setSubmissionError(true);
      setMessage('Server is unreachable. Try again later');
    } else {
      setSubmissionError(true);
      setMessage('An error occurred while processing your request.');
    }
  };


	  const validateForm = () => {
	    let isValid = true;

	    // Validate Email field
	    if (!formData.email.trim()) {
	      setEmailError('Please enter your email.');
	      isValid = false;
	    } else {
	      setEmailError('');
	    }

	    // Validate Password field
	    if (!formData.password) {
	      setPasswordError('Please enter a password.');
	      isValid = false;
	    } else {
	      setPasswordError('');
	    }

	    return isValid;
	  };
	return (
    <div className="main-content user-main-container">
      <Helmet>
        <title>ZimaMoto | Login</title>
      </Helmet>
      <SimpleBar className="page-content page-container-scroll">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xl-3 send-fire-report-form">
              <div className="card card-h-100">
                <div className="card-header justify-content-between d-flex align-items-center">
                  <h4 className="card-title">Login</h4>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <TextField
                          required
                          className="form-control"
                          label="Your Email"
                          helperText={emailError}
                          id="formrow-email-input"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          error={!!emailError}
                        />
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="mb-3 add-user-password-container">
                        <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                          <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                          <OutlinedInput
                            id="outlined-adornment-password"
                            type={showPassword ? 'text' : 'password'}
                            endAdornment={
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={handleClickShowPassword}
                                  onMouseDown={handleMouseDownPassword}
                                  edge="end"
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            }
                            label="Password"
                            required
                            className="form-control"
                            name="password"
                            error={!!passwordError}
                            value={formData.password}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                      </div>
                    </div>

                    {/* Display the progress circle */}
                    {showProgressBar && (
                      <div className="progress-circle-container">
                        <Stack sx={{ color: 'grey.500' }} direction="row">
                          <CircularProgress color="primary" />
                        </Stack>
                      </div>
                    )}

                    {/* Display the success message */}
                    {showSuccessMessage && (
                      <div className={`form-submission-message ${submissionError ? 'text-danger' : 'text-success'}`}>
                        {message}
                      </div>
                    )}

                    <div className="mt-4 add-brigade-sub-btn">
                      <button type="submit" className="btn btn-primary w-md">
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SimpleBar>
    </div>
  );
}

export default Login;