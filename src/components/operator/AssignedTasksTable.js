import React, { useState, useEffect, useRef } from 'react';
import socketIOClient from 'socket.io-client';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import {CustomDropDown} from '../CustomCategorySelection.js';
import {CustomizedInputBase} from '../CustomSearch.js';

const columns = [
  { id: 'name', label: 'Reported By', minWidth: 170, align: 'center' },
  { id: 'location', label: 'Location', minWidth: 170, align: 'center' },
  { id: 'date', label: 'Date', minWidth: 170, align: 'center' },
  { id: 'status', label: 'Status', minWidth: 170, align: 'center' },
];

const AssignedTasks = () => {
  const isMounted = useRef(false);

  const [realtimeData, setRealtimeData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 6;
  const [isLoading, setIsLoading] = useState(false);
  const [dataFetchError, setDataFetchError] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [fireCategory, setFireCategory] = useState('all');
  const [moreRecordsToLoad, setMoreRecordsToLoad] = useState(true);


  useEffect(() => {
    fetchData();

    const socket = socketIOClient('https://zimamoto-deab7f8718a9.herokuapp.com');

    socket.on('connect', () => {
      console.log('WebSocket connected!');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    socket.on('data_update', (newData) => {
      setRealtimeData((prevData) => [newData, ...prevData]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleLoadMore = () => {
    if (!isLoading) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    setRealtimeData([]);
    setCurrentPage(1);
    setMoreRecordsToLoad(true);
  }, [selectedCategory]);



  const fetchDataOnMount = async () => {
    try {
      if (currentPage){
      setIsLoading(true);

      const authToken = localStorage.getItem("access_token");

      const response = await fetch(
        `https://zimamoto-deab7f8718a9.herokuapp.com/zimamoto/reports?page=${currentPage}&limit=${reportsPerPage}&category=${selectedCategory}`,
        {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
      );
      const jsonData = await response.json();

      if (jsonData.data) {
        if (currentPage === 1) {
          setTotalPages(jsonData.total_pages);
          setRealtimeData(jsonData.data);
        } else {
          setRealtimeData((prevData) => [...prevData, ...jsonData.data]);
        }

        setDataFetchError(false);
      } else {
        setDataFetchError(true);
      }

      setIsLoading(false);
    }
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };


  const fetchData = async (page) => {
    try {
      setIsLoading(true);

      const authToken = localStorage.getItem("access_token");

      const response = await fetch(
        `https://zimamoto-deab7f8718a9.herokuapp.com/zimamoto/reports?page=${page}&limit=${reportsPerPage}&category=${selectedCategory}`,
        {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
      );
      const jsonData = await response.json();

      if (jsonData.data) {
        if (currentPage === 1) {
          setTotalPages(jsonData.total_pages);
          setRealtimeData(jsonData.data);
        } else {
          setRealtimeData((prevData) => [...prevData, ...jsonData.data]);
        }

        setDataFetchError(false);
      } else {
        setDataFetchError(true);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  const time_categories = [
      { display: 'All', value: 'all' },
      { display: 'Today', value: 'today' },
      { display: 'This Week', value: 'this week' },
    ];


  const fire_categories = [
      { display: 'All', value: 'all' },
      { display: 'Awaiting Response', value: 'awaiting response' },
      { display: 'Responding', value: 'responding' },
      { display: 'Extinguished', value: 'extinguished' },
    ];

  const handleCategoryChange = (selectedValue) => {
    setSelectedCategory(selectedValue);    
  };

  const handleFireCategoryChange = (selectedValue) => {
    setFireCategory(selectedValue);    
  };


  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    
    fetchData(currentPage);
  }, [selectedCategory, currentPage]);

  return (
    <div className="col-xl-8">
      <div className="card card-h-100">
        <div className="card-body">
        <div className="row users-table-top">
              <div className="col-xl-4">
                <h4 className="card-title mb-4">Assigned Tasks</h4>
              </div>             

              <div className="col-xl-3 search-users-select-cat-container">
                <CustomDropDown
                  options={time_categories}
                  onCategoryChange={handleCategoryChange}
                  selectedParentValue={'All'}   
                  title={'Select Time'}           
                />
              </div>

              <div className="col-xl-3 search-users-select-cat-container">
                <CustomDropDown
                  options={fire_categories}
                  onCategoryChange={handleFireCategoryChange}
                  selectedParentValue={'All'}   
                  title={'Select Category'}           
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
                  {realtimeData.map((row, index) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                      {columns.map((column) => (
                        <TableCell key={column.id} align={column.align}>
                          {column.id === 'name' ? 
                            (
                              `${row["name"]}, ${row["phone"]}`
                            ) :
                          row[column.id] || 'error'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SimpleBar>

          {isLoading && (
            <div className="progress-circle-container">
              <Stack sx={{ color: 'grey.500' }} direction="row">
                <CircularProgress color="primary" />
              </Stack>
            </div>
          )}

          {dataFetchError ? (
            <div className="text-center text-danger">
                Error fetching data. Please try again later.
              </div>
          ): totalPages > currentPage ? (
            <div className="mt-4 load-more-container">
              <button
                type="submit"
                className="btn btn-primary w-md"
                onClick={handleLoadMore}
              >
                Load more
              </button>
            </div>
          ):(
            <div className="text-center text-primary">
                No more records
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignedTasks;
