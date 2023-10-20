import {NavLink} from 'react-router-dom';
import NotFoundImage from '../assets/images/logo-sm.png';

const NotFound = () => {
	return(
		<div className="authentication-bg min-vh-100">
            <div className="bg-overlay bg-white"></div>
            <div className="container">
                <div className="row">
                    <div className="col-md-12">
                        <div className="text-center py-5">
                            <h1 className="display-1 fw-normal error-text">4
                                <img src={NotFoundImage} alt=""
                                    className="avatar-lg h-auto mx-2" />
                                    4
                                    </h1>
                            <h4 className="text-uppercase text-muted">Opps, page not found</h4>
                            <div className="mt-5 text-center">
                                <NavLink to="/" className="btn btn-primary">Back to Home</NavLink>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
		);
}


export default NotFound;