import "./globals.css";
import { AuthProvider } from "../lib/AuthProvider";
import AuthWrapper from "./components/auth-wrapper";
import LogoutButton from "./components/logout-button";

/**
 * @typedef {Object} RootLayoutProps
 * @property {React.ReactNode} children
 */

/**
 * Root layout component
 * @param {RootLayoutProps} props
 * @returns {JSX.Element}
 */

export const metadata = {
	title: "망할네이버단어장",
	description: "영어와 일본어 단어를 학습하는 웹 애플리케이션",
}

export default function RootLayout({ children }) {
	return (
		<html lang="ko">
			<body>
				<AuthProvider>
					<AuthWrapper>
						<div className="min-h-screen bg-gray-100 overflow-hidden">
							<header className="bg-white shadow">
								<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
									<h1 className="font-bold text-gray-900">망할네이버단어장</h1>
									<LogoutButton />
								</div>
							</header>
							<main>
								<div className="max-w-2xl mx-auto pb-6 sm:px-6 lg:px-8">
									{children}
								</div>
							</main>
						</div>
					</AuthWrapper>
				</AuthProvider>
			</body>
		</html>
	);
}