import { useNavigate} from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import {AlertDialogSlide} from '../UserDeleteDialog.js';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import {CustomDropDown} from '../CustomCategorySelection.js';
import {CustomizedInputBase} from '../CustomSearch.js';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import socketIOClient from 'socket.io-client';

const columns = [
  { id: 'BrigadeID', label: 'BrigadeID', minWidth: 100, align: 'center' },
  { id: 'OperatorEmail', label: 'Operator', minWidth: 170, align: 'center' },
  { id: 'Location', label: 'Location', minWidth: 100, align: 'center' },
  { id: 'LocationAddress', label: 'Location Address', minWidth: 150, align: 'center' },
  { id: 'Status', label: 'Status', minWidth: 100, align: 'center' },  
  { id: 'Availability', label: 'Availability', minWidth: 170, align: 'center' },
  { id: 'Actions', label: 'Actions', minWidth: 100, align: 'center' },
];

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const BrigadesTable = () => {
  const isMounted = useRef(false);
  const [brigades, setBrigades] = useState([]);
  const [searchString, setSearchString] = useState('');
  const reportsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [moreUsersToLoad, setMoreUsersToLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);  
  const [dataFetchError, setDataFetchError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [brigadeToDelete, setBrigadeToDelete] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarSeverity, setSnackBarSeverity] = useState('success');
  const [snackBarMessage, setSnackBarMessage] = useState('User Deleted Successfully');
  const navigate = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [message, setMessage] = useState(''); 



  const fetchDataOnMount = async () => {
    try {
      if (currentPage) {
      setIsLoading(true);
      setDataFetchError(false);  
      const authToken = localStorage.getItem("access_token");      
      const response = await axios.get(
        `https://zimamoto-deab7f8718a9.herokuapp.com/get_brigades?category=${selectedCategory}&searchstring=${searchString}&page=${currentPage}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.status === 200) {
            const newUsers = response.data;

            if (newUsers.length >= reportsPerPage) {
                setBrigades((prevUsers) => [...prevUsers, ...newUsers]);
              } else if (newUsers.length < reportsPerPage) {
                setBrigades((prevUsers) => [...prevUsers, ...newUsers]);                  
                setMoreUsersToLoad(false);
              }
      } 
      }       
    } catch (error) {
      handleFetchRequestError(error);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchBrigades = async (page) => {
    try {
      setIsLoading(true);
      setDataFetchError(false);  
      const authToken = localStorage.getItem("access_token");      
      const response = await axios.get(
        `https://zimamoto-deab7f8718a9.herokuapp.com/get_brigades?category=${selectedCategory}&searchstring=${searchString}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.status === 200) {
            const newUsers = response.data;

            if (newUsers.length >= reportsPerPage) {
                setBrigades((prevUsers) => [...prevUsers, ...newUsers]);
              } else if (newUsers.length < reportsPerPage) {
                setBrigades((prevUsers) => [...prevUsers, ...newUsers]);                  
                setMoreUsersToLoad(false);
              }
      }        
    } catch (error) {
      handleFetchRequestError(error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleFetchRequestError = (error) => {
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
    const newSocket = socketIOClient('https://zimamoto-deab7f8718a9.herokuapp.com');

    newSocket.on('brigade_status_update', ({ operatorEmail, status }) => {
      setBrigades((prevBrigades) => {
        const updatedBrigades = prevBrigades.map((brigade) => {
          if (brigade.OperatorEmail.trim() === operatorEmail.trim()) {
            return {
              ...brigade,
              Status: status,
            };
          }
          return brigade;
        });
        return updatedBrigades;
      });
    });


    newSocket.on('brigade_availability_update', ({ operatorEmail, availability }) => {
      setBrigades((prevBrigades) => {
        const updatedBrigades = prevBrigades.map((brigade) => {
          if (brigade.OperatorEmail.trim() === operatorEmail.trim()) {
            return {
              ...brigade,
              Availability: availability,
            };
          }
          return brigade;
        });
        return updatedBrigades;
      });
    });


    newSocket.on('add_brigade', (newData) => {
        setBrigades((prevData) => [newData, ...prevData]);
      });

    
    return () => {
      newSocket.close();
    };
  }, []);


  useEffect(() => {
    setBrigades([]);
    setCurrentPage(1);
    setMoreUsersToLoad(true);
  }, [selectedCategory, searchString]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      fetchDataOnMount();
      return;
    }
    fetchBrigades(currentPage);
  }, [searchString, selectedCategory, currentPage]);

  const user_categories = [
      { display: 'All', value: 'all' },
      { display: 'Engaged', value: 'engaged' },
      { display: 'Active', value: 'active' },
      { display: 'Inactive', value: 'inactive' },
      { display: 'Free', value: 'free' },
      { display: 'Under Maintenance', value: 'under maintenance' },
    ];


    const handleCategoryChange = (selectedValue) => {
      setSelectedCategory(selectedValue);    
    };

    const handleLoadMore = () => {
      setCurrentPage((prevPage) => prevPage + 1);
    }

    const deleteBrigade = (brigade) => {
      setBrigadeToDelete(brigade);
      setShowPopup(true);     
    };

    const cancelDelete = () => {
      setBrigadeToDelete(null);
      setShowPopup(false);
    };

    const confirmDelete = async () => {
      setIsDeleting(true);
      await handleDelete(brigadeToDelete);      
    };

    const handleCloseSnackBar = (event, reason) => {
      if (reason === 'clickaway') {
        return;
      }

      setShowSnackBar(false);
    };

    const customActionsTheme = createTheme({
      palette: {
        delete: {
          main: '#ff6384',
        },
        edit: {
          main: '#038edc',
          light: '#F5EBFF',
          // dark: will be calculated from palette.secondary.main,
          contrastText: '#47008F',
        },
      },
    });

    const handleDelete = async (brigadeToDelete) => {
      try {
        const authToken = localStorage.getItem("access_token");
        const response = await axios.delete(`https://zimamoto-deab7f8718a9.herokuapp.com/deletebrigade/${brigadeToDelete.BrigadeID}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.status === 200) {
          setSnackBarSeverity('success');
          setSnackBarMessage(response.data.message);
          setBrigades(prevBrigades => prevBrigades.filter(brigade => brigade.BrigadeID !== brigadeToDelete.BrigadeID));
        }
      } catch (error) {
        handleRequestError(error);
      } finally {
        setIsDeleting(false);
        setShowPopup(false);
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


    const handleEditClick = (brigadeId) => {
      navigate(`/admin/manage-brigades/edit-brigade/${brigadeId}`); // Replace with the appropriate URL
    };

	return(
		<div className="col-xl-12">
	      <div className="card card-h-100">
	        <div className="card-body">
	          <div className="row users-table-top">
              <div className="col-xl-2">
                <h4 className="card-title mb-4">Brigades</h4>
              </div>             

              <div className="col-xl-3 search-users-select-cat-container">
                <CustomDropDown
                  options={user_categories}
                  onCategoryChange={handleCategoryChange}
                  selectedParentValue = {'All'}
                  title={'Select Category'}
                />
              </div>

              <div className="col-xl-4 user-search-container">
                  <CustomizedInputBase 
                    searchString={searchString}
                    setSearchString={setSearchString}
                    placeholder={'Search Brigades'}                    
                  />
              </div>
            </div>
          	<SimpleBar className="table-responsive fire-reports-container">
              <TableContainer>
                <Table stickyHeader aria-label="sticky table">
                  <TableHead>
                    <TableRow>
                      {columns.map((column) => (
                        <TableCell
                          key={column.id}
                          align={column.align}
                          style={{ minWidth: column.minWidth }}
                        >
                          {column.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {brigades.map((row, index) => (
                      <TableRow key={row.id} hover role="checkbox" tabIndex={-1} key={index}>
                        {columns.map((column) => (
                          <TableCell key={column.id} align={column.align}>
                            {column.id === 'Actions' ? 
                            (<Stack direction="row" spacing={2} className="action-btns-holder">

                            <ThemeProvider theme={customActionsTheme}>                                  
                                <IconButton aria-label="edit" size="small" onClick={() => handleEditClick(row.BrigadeID)} color="edit">
                                  <EditIcon fontSize="small" />
                                </IconButton>

                                <IconButton aria-label="delete" size="small" onClick={() => deleteBrigade(row)} color="delete">
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </ThemeProvider>

                              </Stack>) : 
                              column.id === 'BrigadeID' ? (`BR-${row[column.id]}`):                              
                              row[column.id] || 'error'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                    </Table>
                  </TableContainer>
                </SimpleBar>

                {showSnackBar && (
                  <Snackbar open={showSnackBar} autoHideDuration={6000} onClose={handleCloseSnackBar}>
                    <Alert onClose={handleCloseSnackBar} severity={snackBarSeverity} sx={{ width: '100%' }}>
                      {snackBarMessage}
                    </Alert>
                  </Snackbar>
                )}


                {showPopup && (
                <Dialog
                  fullScreen={fullScreen}
                  open={showPopup}
                  onClose={cancelDelete}
                  aria-labelledby="responsive-dialog-title"
                >
                  <DialogTitle id="responsive-dialog-title">
                    Delete brigade
                  </DialogTitle>
                  <DialogContent>
                    <DialogContentText>
                      Are you sure you want to delete BR-{brigadeToDelete.BrigadeID}?
                    </DialogContentText>
                  </DialogContent>
                  {isDeleting && (
                    <div className="progress-circle-container">
                      <Stack sx={{ color: 'grey.500' }} direction="row">
                        <CircularProgress color="primary" />
                      </Stack>
                    </div>
                  )}
                  <DialogActions>
                    <Button onClick={cancelDelete}>
                      Cancel
                    </Button>
                    <Button autoFocus onClick={confirmDelete}>
                      Confirm
                    </Button>
                  </DialogActions>
                </Dialog>
                )}

                {/* Show the confirmation popup */}
                {/*{showPopup && (
                  <AlertDialogSlide
                    title={`Delete brigade`}
                    message={`Are you sure you want to delete BR-${brigadeToDelete.BrigadeID}?`}
                    onCancel={cancelDelete}
                    onConfirm={confirmDelete}
                    open={showPopup}
                  />
                )} */}

                {isLoading && (
                <div className="progress-circle-container">
                  <Stack sx={{ color: 'grey.500' }} direction="row">
                    <CircularProgress color="primary" />
                  </Stack>
                </div>
              )}

                {!dataFetchError && moreUsersToLoad ? (
                    <div className="mt-4 load-more-container">
                      <button
                        type="submit"
                        className="btn btn-primary w-md"
                        onClick={handleLoadMore}
                      >
                        Load more
                      </button>
                    </div>
                  ) : (
                    !dataFetchError && !moreUsersToLoad ? (
                      <div className="text-center text-primary">
                        No more records
                      </div>
                    ) : null // You can provide a fallback or return null if neither condition is met
                  )}

                  {dataFetchError && (
                    <div className="text-center text-danger">
                        {message}
                      </div>
                      )}
          	</div>
      		</div>
      	</div>
	);
}

export default BrigadesTable;