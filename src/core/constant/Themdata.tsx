import { AppColor } from './Colorapp';

export const themeLight = {
  brightness: "light",
  fontFamily: "Cairo",
  scaffoldBackgroundColor: AppColor.bgLight,
  cardColor: AppColor.cardLight,
  dividerColor: AppColor.borderLight,
  primaryColor: AppColor.primaryApp,
  appBarTheme: {
    centerTitle: true,
    titleTextStyle: {
      color: AppColor.textLight,
      fontWeight: "bold",
      fontFamily: "Cairo",
      fontSize: 20,
    },
    iconTheme: { color: AppColor.primaryApp },
    backgroundColor: AppColor.cardLight,
    elevation: 1,
  },
  bottomAppBarTheme: {
    color: AppColor.cardLight,
    elevation: 8,
  },
  textTheme: {
    headlineLarge: {
      fontWeight: "bold",
      fontSize: 22,
      color: AppColor.textLight,
      fontFamily: "Cairo",
    },
    headlineMedium: {
      fontWeight: "bold",
      fontSize: 18,
      color: AppColor.textLight,
      fontFamily: "Cairo",
    },
    headlineSmall: {
      fontWeight: "bold",
      fontSize: 16,
      color: AppColor.textLight,
      fontFamily: "Cairo",
    },
    bodyLarge: {
      height: 1.6,
      color: AppColor.textLight,
      fontWeight: "bold",
      fontSize: 15,
      fontFamily: "Cairo",
    },
    bodyMedium: {
      height: 1.6,
      color: AppColor.textLightSub,
      fontWeight: "600",
      fontSize: 14,
      fontFamily: "Cairo",
    },
    bodySmall: {
      height: 1.6,
      color: AppColor.grey,
      fontWeight: "500",
      fontSize: 12,
      fontFamily: "Cairo",
    },
  },
};

export const themeDark = {
  brightness: "dark",
  fontFamily: "Cairo",
  scaffoldBackgroundColor: AppColor.bgDark,
  cardColor: AppColor.cardDark,
  dividerColor: AppColor.borderDark,
  primaryColor: AppColor.primaryApp,
  appBarTheme: {
    centerTitle: true,
    titleTextStyle: {
      color: AppColor.textDark,
      fontWeight: "bold",
      fontFamily: "Cairo",
      fontSize: 20,
    },
    iconTheme: { color: AppColor.textDark },
    backgroundColor: AppColor.cardDark,
    elevation: 1,
  },
  bottomAppBarTheme: {
    color: AppColor.cardDark,
    elevation: 8,
  },
  textTheme: {
    headlineLarge: {
      fontWeight: "bold",
      fontSize: 22,
      color: AppColor.textDark,
      fontFamily: "Cairo",
    },
    headlineMedium: {
      fontWeight: "bold",
      fontSize: 18,
      color: AppColor.textDark,
      fontFamily: "Cairo",
    },
    headlineSmall: {
      fontWeight: "bold",
      fontSize: 16,
      color: AppColor.textDark,
      fontFamily: "Cairo",
    },
    bodyLarge: {
      height: 1.6,
      color: AppColor.textDark,
      fontWeight: "bold",
      fontSize: 15,
      fontFamily: "Cairo",
    },
    bodyMedium: {
      height: 1.6,
      color: AppColor.textDarkSub,
      fontWeight: "600",
      fontSize: 14,
      fontFamily: "Cairo",
    },
    bodySmall: {
      height: 1.6,
      color: AppColor.grey,
      fontWeight: "500",
      fontSize: 12,
      fontFamily: "Cairo",
    },
  },
};

