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
  { id: 'name', label: 'Name', minWidth: 170, align: 'center' },
  { id: 'phone', label: 'Phone', minWidth: 100, align: 'center' },
  { id: 'email', label: 'Email', minWidth: 170, align: 'center' },
  { id: 'role', label: 'Role', minWidth: 170, align: 'center' },
  { id: 'actions', label: 'Actions', minWidth: 170, align: 'center' },
];


const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const UsersTable = () => {

	const isMounted = useRef(false);
  const [users, setUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [moreUsersToLoad, setMoreUsersToLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dataFetchError, setDataFetchError] = useState(false);
  const [searchString, setSearchString] = useState('');
  const reportsPerPage = 6;
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarSeverity, setSnackBarSeverity] = useState('');
  const [snackBarMessage, setSnackBarMessage] = useState('');
  const [message, setMessage] = useState('');   

  const navigate = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const handleEditClick = (userId) => {
      navigate(`/admin/manage-users/edit-user/${userId}`);
    };



    const fetchDataOnMount = async () => {
      try {
        if (currentPage){
        setIsLoading(true);
        setDataFetchError(false);
        const authToken = localStorage.getItem("access_token");        
        const response = await axios.get(
          `https://zimamoto-deab7f8718a9.herokuapp.com/get_users?category=${selectedCategory}&searchstring=${searchString}&page=${currentPage}`,
          {
            headers: {Authorization: `Bearer ${authToken}`,},
          }
        );

        if (response.status === 200) {
              const newUsers = response.data;

              if (newUsers.length >= reportsPerPage) {
                  setUsers((prevUsers) => [...prevUsers, ...newUsers]);
                } else if (newUsers.length < reportsPerPage) {
                  setUsers((prevUsers) => [...prevUsers, ...newUsers]);                  
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

    const fetchUsers = async (page) => {
      try {
        setIsLoading(true);
        setDataFetchError(false);
        const authToken = localStorage.getItem("access_token");        
        const response = await axios.get(
          `https://zimamoto-deab7f8718a9.herokuapp.com/get_users?category=${selectedCategory}&searchstring=${searchString}&page=${page}`,
          {
            headers: {Authorization: `Bearer ${authToken}`,},
          }
        );

        if (response.status === 200) {
              const newUsers = response.data;

              if (newUsers.length >= reportsPerPage) {
                  setUsers((prevUsers) => [...prevUsers, ...newUsers]);
                } else if (newUsers.length < reportsPerPage) {
                  setUsers((prevUsers) => [...prevUsers, ...newUsers]);                  
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
    setUsers([]);
    setCurrentPage(1);
    setMoreUsersToLoad(true);
  }, [selectedCategory, searchString]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      fetchDataOnMount();
      return;
    }

    // Use the currentPage state to determine which page to fetch
    fetchUsers(currentPage);
  }, [searchString, selectedCategory, currentPage]);

    const deleteUser = (user) => {
      setUserToDelete(user);
      setShowPopup(true);     
    };

    const cancelDelete = () => {
      setUserToDelete(null);
      setShowPopup(false);
    };

    const confirmDelete = async () => {
      setIsDeleting(true);
      await handleDelete(userToDelete);
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


    const handleDelete = async (userToDelete) => {
      try {
        const authToken = localStorage.getItem("access_token");
        const response = await axios.delete(`https://zimamoto-deab7f8718a9.herokuapp.com/deleteuser/${userToDelete.id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.status === 200) {
          setSnackBarSeverity('success');
          setSnackBarMessage(response.data.message);
          setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
        }
      } catch (error) {
        handleRequestError(error);
      } finally {
        setIsDeleting(false);
        setShowPopup(false);
        setShowSnackBar(true);
      }
    };



    useEffect(() => {
      const newSocket = socketIOClient('https://zimamoto-deab7f8718a9.herokuapp.com');

      newSocket.on('update_users', (newData) => {
        setUsers((prevData) => [newData, ...prevData]);
      });

      
      return () => {
        newSocket.close();
      };
    }, []);


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


    const handleCloseSnackBar = (event, reason) => {
      if (reason === 'clickaway') {
        return;
      }

      setShowSnackBar(false);
    };


    const user_categories = [
      { display: 'All', value: 'all' },
      { display: 'Administrators', value: 'administrator' },
      { display: 'Staff', value: 'staff' },
      { display: 'Operators', value: 'operator' },
    ];


  const handleCategoryChange = (selectedValue) => {
    setSelectedCategory(selectedValue);    
  };

  const handleLoadMore = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  }

return(
		<div className="col-xl-8">
	      <div className="card card-h-100">
	        <div className="card-body">
          <div className="row users-table-top">
	            <div className="col-xl-2">
                <h4 className="card-title mb-4">Users</h4>
              </div>             

              <div className="col-xl-3 search-users-select-cat-container">
                <CustomDropDown
                  options={user_categories}
                  onCategoryChange={handleCategoryChange}
                  selectedParentValue = {'All'}
                  title={'Select Category'}                                    
                />
              </div>

              <div className="col-xl-3 user-search-container">
                  <CustomizedInputBase 
                    searchString={searchString}
                    setSearchString={setSearchString}
                    placeholder={'Search Users'}
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
                        {users.map((row, index) => (
                          <TableRow key={row.id} hover role="checkbox" tabIndex={-1} key={index}>
                            {columns.map((column) => (
                              <TableCell key={column.id} align={column.align}>
                                {column.id === 'actions' ? 
                                (<Stack direction="row" spacing={2} className="action-btns-holder">

                                <ThemeProvider theme={customActionsTheme}>                                  
                                    <IconButton aria-label="edit" size="small" onClick={() => handleEditClick(row.id)} color="edit">
                                      <EditIcon fontSize="small" />
                                    </IconButton>

                                    <IconButton aria-label="delete" size="small" onClick={() => deleteUser(row)} color="delete">
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </ThemeProvider>

                                  </Stack>) : 
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

                {/* Show the confirmation popup */}
                {showPopup && (
                <Dialog
                  fullScreen={fullScreen}
                  open={showPopup}
                  onClose={cancelDelete}
                  aria-labelledby="responsive-dialog-title"
                >
                  <DialogTitle id="responsive-dialog-title">
                    {`Delete user`}
                  </DialogTitle>
                  <DialogContent>
                    <DialogContentText>
                      Are you sure you want to delete {userToDelete.name}?
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
                    <Button autoFocus onClick={cancelDelete}>
                      Cancel
                    </Button>
                    <Button onClick={confirmDelete} autoFocus>
                      Confirm
                    </Button>
                  </DialogActions>
                </Dialog>
                )}
                {/*{showPopup && (
                  <AlertDialogSlide
                    title={`Delete user`}
                    message={`Are you sure you want to delete ${userToDelete.name}?`}
                    onCancel={cancelDelete}
                    onConfirm={confirmDelete}
                    open={showPopup}
                  >
                  <h1>the head</h1>
                  </AlertDialogSlide>
                )}*/}

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

export default UsersTable;