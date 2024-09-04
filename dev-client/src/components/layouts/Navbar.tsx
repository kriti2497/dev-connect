import { Avatar, Grid2 } from "@mui/material";

const Navbar = () => {
  return (
    <Grid2 container justifyContent={"space-between"} p={1}>
      <Grid2
        container
        className="flex items-center font-primary cursor-pointer"
        // onClick={() => navigate(ROUTES.HOME)}
      >
        {/* <img className="w-12 h-12" src={AppLogo} alt="logo" /> */}
        <h2 className="font-bold">Techie Hub</h2>
      </Grid2>
      <Grid2 container className="flex text-blue-600 gap-6 items-center">
        {/* <Link href="/" activeClassName="active">
      Techies
    </Link>
    <Link href={ROUTES.REGISTER_ROUTE} activeClassName="active">
      Sign Up
    </Link>
    <Link href={ROUTES.LOGIN_ROUTE} activeClassName="active">
      Login
    </Link> */}
        <Avatar alt="profile" />
      </Grid2>
    </Grid2>
  );
};

export default Navbar;
